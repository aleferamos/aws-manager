import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac } from 'node:crypto';
import { Repository } from 'typeorm';

import {
  BillingCostAndUsageDto,
  BillingCostGroupDto,
  BillingCostTimeResultDto,
} from './dto/billing-cost.dto';
import {
  BillingCostQueryDto,
  BillingGranularity,
  BillingGroupBy,
} from './dto/billing-cost-query.dto';
import { Authority } from '../authority/entities/authority.entity';
import { CredentialEncryptionService } from '../credential/credential-encryption.service';
import { Credential } from '../credential/entities/credential.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';
import { UserCredential } from '../credential/entities/user-credential.entity';
import { I18nService } from '../shared/i18n/i18n.service';
import { User } from '../user/entities/user.entity';

const BILLING_AUTHORITY_CODE = 'AWS_INVOICE';
const COST_EXPLORER_REGION =
  process.env.AWS_COST_EXPLORER_REGION ?? 'us-east-1';
const COST_EXPLORER_SERVICE = 'ce';
const COST_EXPLORER_TARGET = 'AWSInsightsIndexService.GetCostAndUsage';
const COST_EXPLORER_CONTENT_TYPE = 'application/x-amz-json-1.1';

interface AwsMetricValue {
  Amount?: string;
  Unit?: string;
}

interface AwsCostExplorerGroup {
  Keys?: string[];
  Metrics?: Record<string, AwsMetricValue>;
}

interface AwsCostExplorerTimeResult {
  TimePeriod?: {
    Start?: string;
    End?: string;
  };
  Total?: Record<string, AwsMetricValue>;
  Groups?: AwsCostExplorerGroup[];
  Estimated?: boolean;
}

interface AwsCostExplorerResponse {
  ResultsByTime?: AwsCostExplorerTimeResult[];
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Authority)
    private readonly authorityRepository: Repository<Authority>,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserCredential)
    private readonly userCredentialRepository: Repository<UserCredential>,
    @InjectRepository(UserCredentialAuthority)
    private readonly userCredentialAuthorityRepository: Repository<UserCredentialAuthority>,
    private readonly credentialEncryptionService: CredentialEncryptionService,
    private readonly i18n: I18nService,
  ) {}

  async getCostAndUsage(
    userId: string,
    query: BillingCostQueryDto,
  ): Promise<BillingCostAndUsageDto> {
    const [user, credential] = await Promise.all([
      this.findUserOrFail(userId),
      this.findCredentialWithSecretsOrFail(query.credentialId),
    ]);

    if (!credential.active) {
      throw new BadRequestException({
        code: 'BILLING_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('billing.credentialInactive'),
      });
    }

    await this.assertCanReadBilling(user, credential.id);

    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );
    const region = query.region.trim();
    const timePeriod = this.getTimePeriod(query.startDate, query.endDate);
    const awsResponse = await this.callCostExplorer({
      accessKeyId: secrets.accessKeyId,
      secretAccessKey: secrets.secretKeyId,
      region: COST_EXPLORER_REGION,
      payload: {
        TimePeriod: timePeriod,
        Granularity: query.granularity ?? 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: query.groupBy ?? 'SERVICE',
          },
        ],
        Filter: {
          Dimensions: {
            Key: 'REGION',
            Values: [region],
          },
        },
      },
    });

    return this.toBillingCostAndUsageDto(
      credential,
      region,
      COST_EXPLORER_REGION,
      awsResponse,
    );
  }

  private async findUserOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        type: true,
        active: true,
      },
    });

    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: this.i18n.translate('user.notFound'),
      });
    }

    if (!user.active) {
      throw new ForbiddenException({
        code: 'AUTH_USER_DISABLED',
        message: this.i18n.translate('auth.userDisabled'),
      });
    }

    return user;
  }

  private async findCredentialWithSecretsOrFail(
    id: string,
  ): Promise<Credential> {
    const credential = await this.credentialRepository
      .createQueryBuilder('credential')
      .addSelect('credential.encryptedFile')
      .where('credential.id = :id', { id })
      .getOne();

    if (!credential) {
      throw new BadRequestException({
        code: 'CREDENTIAL_NOT_FOUND',
        message: this.i18n.translate('credential.notFound'),
      });
    }

    return credential;
  }

  private async assertCanReadBilling(
    user: User,
    credentialId: string,
  ): Promise<void> {
    if (user.isRoot) {
      return;
    }

    const authority = await this.authorityRepository.findOne({
      where: {
        code: BILLING_AUTHORITY_CODE,
      },
      select: {
        id: true,
      },
    });

    if (!authority) {
      throw new BadRequestException({
        code: 'BILLING_AUTHORITY_NOT_CONFIGURED',
        message: this.i18n.translate('billing.authorityNotConfigured'),
      });
    }

    const userCredential = await this.userCredentialRepository.findOne({
      where: {
        userId: user.id,
        credentialId,
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (!userCredential) {
      throw new ForbiddenException({
        code: 'BILLING_CREDENTIAL_ACCESS_REQUIRED',
        message: this.i18n.translate('billing.credentialAccessRequired'),
      });
    }

    const hasBillingAuthority =
      await this.userCredentialAuthorityRepository.exists({
        where: {
          userCredentialId: userCredential.id,
          authorityId: authority.id,
        },
      });

    if (!hasBillingAuthority) {
      throw new ForbiddenException({
        code: 'BILLING_AUTHORITY_REQUIRED',
        message: this.i18n.translate('billing.authorityRequired'),
      });
    }
  }

  private getTimePeriod(startDate?: string, endDate?: string) {
    const now = new Date();
    const start =
      startDate ??
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
        2,
        '0',
      )}-01`;
    const end = endDate ?? this.toDateOnly(this.addUtcDays(now, 1));

    if (
      new Date(`${start}T00:00:00.000Z`) >= new Date(`${end}T00:00:00.000Z`)
    ) {
      throw new BadRequestException({
        code: 'BILLING_INVALID_TIME_PERIOD',
        message: this.i18n.translate('billing.invalidTimePeriod'),
      });
    }

    return {
      Start: start,
      End: end,
    };
  }

  private async callCostExplorer(options: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    payload: {
      TimePeriod: {
        Start: string;
        End: string;
      };
      Granularity: BillingGranularity;
      Metrics: string[];
      GroupBy: Array<{
        Type: 'DIMENSION';
        Key: BillingGroupBy;
      }>;
      Filter?: {
        Dimensions: {
          Key: 'REGION';
          Values: string[];
        };
      };
    };
  }): Promise<AwsCostExplorerResponse> {
    const body = JSON.stringify(options.payload);
    const host = `ce.${options.region}.amazonaws.com`;
    const endpoint = `https://${host}/`;
    const amzDate = this.toAmzDate(new Date());
    const dateStamp = amzDate.slice(0, 8);
    const authorization = this.createAuthorizationHeader({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      region: options.region,
      host,
      amzDate,
      dateStamp,
      body,
    });
    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': COST_EXPLORER_CONTENT_TYPE,
          Host: host,
          'X-Amz-Date': amzDate,
          'X-Amz-Target': COST_EXPLORER_TARGET,
        },
        body,
      });
    } catch {
      throw new BadRequestException({
        code: 'BILLING_AWS_CONNECTION_FAILED',
        message: this.i18n.translate('billing.awsConnectionFailed'),
      });
    }

    const responseText = await response.text();

    if (!response.ok) {
      throw new BadRequestException({
        code: 'BILLING_AWS_REQUEST_FAILED',
        message: this.i18n.translate('billing.awsRequestFailed', {
          status: response.status,
        }),
        awsMessage: this.extractAwsErrorMessage(responseText),
      });
    }

    return JSON.parse(responseText) as AwsCostExplorerResponse;
  }

  private createAuthorizationHeader(options: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    host: string;
    amzDate: string;
    dateStamp: string;
    body: string;
  }): string {
    const canonicalHeaders = [
      `content-type:${COST_EXPLORER_CONTENT_TYPE}`,
      `host:${options.host}`,
      `x-amz-date:${options.amzDate}`,
      `x-amz-target:${COST_EXPLORER_TARGET}`,
    ].join('\n');
    const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';
    const payloadHash = this.sha256(options.body);
    const canonicalRequest = [
      'POST',
      '/',
      '',
      canonicalHeaders,
      '',
      signedHeaders,
      payloadHash,
    ].join('\n');
    const credentialScope = `${options.dateStamp}/${options.region}/${COST_EXPLORER_SERVICE}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      options.amzDate,
      credentialScope,
      this.sha256(canonicalRequest),
    ].join('\n');
    const signingKey = this.getSignatureKey(
      options.secretAccessKey,
      options.dateStamp,
      options.region,
      COST_EXPLORER_SERVICE,
    );
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign, 'utf8')
      .digest('hex');

    return `AWS4-HMAC-SHA256 Credential=${options.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private getSignatureKey(
    secretAccessKey: string,
    dateStamp: string,
    region: string,
    service: string,
  ): Buffer {
    const dateKey = this.hmac(`AWS4${secretAccessKey}`, dateStamp);
    const dateRegionKey = this.hmac(dateKey, region);
    const dateRegionServiceKey = this.hmac(dateRegionKey, service);

    return this.hmac(dateRegionServiceKey, 'aws4_request');
  }

  private toBillingCostAndUsageDto(
    credential: Credential,
    region: string,
    costExplorerRegion: string,
    response: AwsCostExplorerResponse,
  ): BillingCostAndUsageDto {
    const resultsByTime = (response.ResultsByTime ?? []).map((result) =>
      this.toTimeResult(result),
    );
    const currency = resultsByTime[0]?.totalUnit ?? 'USD';

    return {
      credentialId: credential.id,
      credentialName: credential.name,
      region,
      costExplorerRegion,
      currency,
      totalAmount: resultsByTime.reduce(
        (total, result) => total + result.totalAmount,
        0,
      ),
      resultsByTime,
    };
  }

  private toTimeResult(
    result: AwsCostExplorerTimeResult,
  ): BillingCostTimeResultDto {
    const totalMetric = result.Total?.UnblendedCost;
    const groups = (result.Groups ?? []).map((group) => this.toGroup(group));

    return {
      start: result.TimePeriod?.Start ?? '',
      end: result.TimePeriod?.End ?? '',
      estimated: result.Estimated ?? false,
      totalAmount: Number(totalMetric?.Amount ?? 0),
      totalUnit: totalMetric?.Unit ?? groups[0]?.unit ?? 'USD',
      groups,
    };
  }

  private toGroup(group: AwsCostExplorerGroup): BillingCostGroupDto {
    const metric = group.Metrics?.UnblendedCost;

    return {
      key: group.Keys?.join(' / ') ?? '',
      amount: Number(metric?.Amount ?? 0),
      unit: metric?.Unit ?? 'USD',
    };
  }

  private hmac(key: string | Buffer, value: string): Buffer {
    return createHmac('sha256', key).update(value, 'utf8').digest();
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  private toAmzDate(date: Date): string {
    return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  private addUtcDays(date: Date, days: number): Date {
    const nextDate = new Date(date);

    nextDate.setUTCDate(nextDate.getUTCDate() + days);

    return nextDate;
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private extractAwsErrorMessage(responseText: string): string | null {
    try {
      const parsed = JSON.parse(responseText) as { message?: string };

      return parsed.message ?? null;
    } catch {
      return responseText || null;
    }
  }
}
