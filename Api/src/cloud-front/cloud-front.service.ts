import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac } from 'node:crypto';
import { Repository } from 'typeorm';

import {
  CloudFrontDistributionDetailDto,
  CloudFrontDistributionDto,
  CloudFrontDistributionListDto,
  CloudFrontInvalidationDto,
  CloudFrontInvalidationListDto,
} from './dto/cloud-front.dto';
import { CreateCloudFrontInvalidationDto } from './dto/create-cloud-front-invalidation.dto';
import { ListCloudFrontQueryDto } from './dto/list-cloud-front-query.dto';
import { Authority } from '../authority/entities/authority.entity';
import { CredentialEncryptionService } from '../credential/credential-encryption.service';
import { Credential } from '../credential/entities/credential.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';
import { UserCredential } from '../credential/entities/user-credential.entity';
import { I18nService } from '../shared/i18n/i18n.service';
import { User } from '../user/entities/user.entity';

const CLOUDFRONT_LIST_DISTRIBUTIONS_AUTHORITY_CODE =
  'AWS_CLOUDFRONT_LIST_DISTRIBUTIONS';
const CLOUDFRONT_LIST_INVALIDATIONS_AUTHORITY_CODE =
  'AWS_CLOUDFRONT_LIST_INVALIDATIONS';
const CLOUDFRONT_CREATE_INVALIDATION_AUTHORITY_CODE =
  'AWS_CLOUDFRONT_CREATE_INVALIDATION';
const CLOUDFRONT_SERVICE = 'cloudfront';
const CLOUDFRONT_REGION = 'us-east-1';
const CLOUDFRONT_HOST = 'cloudfront.amazonaws.com';
const CLOUDFRONT_API_VERSION = '2020-05-31';
const XML_CONTENT_TYPE = 'application/xml';

type CloudFrontSecrets = {
  accessKeyId: string;
  secretAccessKey: string;
};

@Injectable()
export class CloudFrontService {
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

  async listDistributions(
    userId: string,
    query: ListCloudFrontQueryDto,
  ): Promise<CloudFrontDistributionListDto> {
    const [user, credential] = await this.getUserAndCredential(
      userId,
      query.credentialId,
    );

    await this.assertCanUseCloudFrontAuthority({
      user,
      credentialId: credential.id,
      authorityCode: CLOUDFRONT_LIST_DISTRIBUTIONS_AUTHORITY_CODE,
      authorityNotConfiguredCode:
        'CLOUDFRONT_LIST_DISTRIBUTIONS_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode:
        'CLOUDFRONT_LIST_DISTRIBUTIONS_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey:
        'cloudFront.listDistributionsAuthorityNotConfigured',
      authorityRequiredMessageKey:
        'cloudFront.listDistributionsAuthorityRequired',
    });

    const xml = await this.callCloudFront({
      ...this.getSecrets(credential),
      method: 'GET',
      path: `/${CLOUDFRONT_API_VERSION}/distribution`,
    });

    return {
      credentialId: credential.id,
      items: this.parseDistributions(xml),
    };
  }

  async viewDistribution(
    userId: string,
    distributionId: string,
    query: ListCloudFrontQueryDto,
  ): Promise<CloudFrontDistributionDetailDto> {
    const normalizedDistributionId = this.normalizeDistributionId(distributionId);
    const [user, credential] = await this.getUserAndCredential(
      userId,
      query.credentialId,
    );

    await this.assertCanUseCloudFrontAuthority({
      user,
      credentialId: credential.id,
      authorityCode: CLOUDFRONT_LIST_DISTRIBUTIONS_AUTHORITY_CODE,
      authorityNotConfiguredCode:
        'CLOUDFRONT_LIST_DISTRIBUTIONS_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode:
        'CLOUDFRONT_LIST_DISTRIBUTIONS_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey:
        'cloudFront.listDistributionsAuthorityNotConfigured',
      authorityRequiredMessageKey:
        'cloudFront.listDistributionsAuthorityRequired',
    });

    const xml = await this.callCloudFront({
      ...this.getSecrets(credential),
      method: 'GET',
      path: `/${CLOUDFRONT_API_VERSION}/distribution/${encodeURIComponent(
        normalizedDistributionId,
      )}`,
    });

    return {
      credentialId: credential.id,
      distribution: this.parseDistributionDetail(xml),
    };
  }

  async listInvalidations(
    userId: string,
    distributionId: string,
    query: ListCloudFrontQueryDto,
  ): Promise<CloudFrontInvalidationListDto> {
    const normalizedDistributionId = this.normalizeDistributionId(distributionId);
    const [user, credential] = await this.getUserAndCredential(
      userId,
      query.credentialId,
    );

    await this.assertCanUseCloudFrontAuthority({
      user,
      credentialId: credential.id,
      authorityCode: CLOUDFRONT_LIST_INVALIDATIONS_AUTHORITY_CODE,
      authorityNotConfiguredCode:
        'CLOUDFRONT_LIST_INVALIDATIONS_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'CLOUDFRONT_LIST_INVALIDATIONS_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey:
        'cloudFront.listInvalidationsAuthorityNotConfigured',
      authorityRequiredMessageKey:
        'cloudFront.listInvalidationsAuthorityRequired',
    });

    const xml = await this.callCloudFront({
      ...this.getSecrets(credential),
      method: 'GET',
      path: `/${CLOUDFRONT_API_VERSION}/distribution/${encodeURIComponent(
        normalizedDistributionId,
      )}/invalidation`,
    });

    return {
      credentialId: credential.id,
      distributionId: normalizedDistributionId,
      items: this.parseInvalidations(xml),
    };
  }

  async createInvalidation(
    userId: string,
    distributionId: string,
    dto: CreateCloudFrontInvalidationDto,
  ): Promise<CloudFrontInvalidationDto> {
    const normalizedDistributionId = this.normalizeDistributionId(distributionId);
    const paths = this.normalizeInvalidationPaths(dto.paths);
    const [user, credential] = await this.getUserAndCredential(
      userId,
      dto.credentialId,
    );

    await this.assertCanUseCloudFrontAuthority({
      user,
      credentialId: credential.id,
      authorityCode: CLOUDFRONT_CREATE_INVALIDATION_AUTHORITY_CODE,
      authorityNotConfiguredCode:
        'CLOUDFRONT_CREATE_INVALIDATION_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'CLOUDFRONT_CREATE_INVALIDATION_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey:
        'cloudFront.createInvalidationAuthorityNotConfigured',
      authorityRequiredMessageKey:
        'cloudFront.createInvalidationAuthorityRequired',
    });

    const body = this.buildInvalidationBatchXml(
      paths,
      dto.callerReference || `aws-manager-${Date.now()}`,
    );
    const xml = await this.callCloudFront({
      ...this.getSecrets(credential),
      method: 'POST',
      path: `/${CLOUDFRONT_API_VERSION}/distribution/${encodeURIComponent(
        normalizedDistributionId,
      )}/invalidation`,
      body,
      contentType: XML_CONTENT_TYPE,
    });

    return this.parseInvalidation(xml);
  }

  private async getUserAndCredential(
    userId: string,
    credentialId: string,
  ): Promise<[User, Credential]> {
    const [user, credential] = await Promise.all([
      this.findUserOrFail(userId),
      this.findCredentialWithSecretsOrFail(credentialId),
    ]);

    if (!credential.active) {
      throw new BadRequestException({
        code: 'CLOUDFRONT_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('cloudFront.credentialInactive'),
      });
    }

    return [user, credential];
  }

  private async findUserOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        type: true,
      },
    });

    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: this.i18n.translate('user.notFound'),
      });
    }

    return user;
  }

  private async findCredentialWithSecretsOrFail(id: string): Promise<Credential> {
    const credential = await this.credentialRepository.findOne({
      where: { id },
      select: {
        id: true,
        active: true,
        encryptedFile: true,
      },
    });

    if (!credential) {
      throw new BadRequestException({
        code: 'CREDENTIAL_NOT_FOUND',
        message: this.i18n.translate('credential.notFound'),
      });
    }

    return credential;
  }

  private async assertCanUseCloudFrontAuthority(options: {
    user: User;
    credentialId: string;
    authorityCode: string;
    authorityNotConfiguredCode: string;
    authorityRequiredCode: string;
    authorityNotConfiguredMessageKey:
      | 'cloudFront.listDistributionsAuthorityNotConfigured'
      | 'cloudFront.listInvalidationsAuthorityNotConfigured'
      | 'cloudFront.createInvalidationAuthorityNotConfigured';
    authorityRequiredMessageKey:
      | 'cloudFront.listDistributionsAuthorityRequired'
      | 'cloudFront.listInvalidationsAuthorityRequired'
      | 'cloudFront.createInvalidationAuthorityRequired';
  }): Promise<void> {
    if (options.user.isRoot) {
      return;
    }

    const authority = await this.authorityRepository.findOne({
      where: {
        code: options.authorityCode,
      },
      select: {
        id: true,
      },
    });

    if (!authority) {
      throw new BadRequestException({
        code: options.authorityNotConfiguredCode,
        message: this.i18n.translate(options.authorityNotConfiguredMessageKey),
      });
    }

    const userCredential = await this.userCredentialRepository.findOne({
      where: {
        userId: options.user.id,
        credentialId: options.credentialId,
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (!userCredential) {
      throw new ForbiddenException({
        code: 'CLOUDFRONT_CREDENTIAL_ACCESS_REQUIRED',
        message: this.i18n.translate('cloudFront.credentialAccessRequired'),
      });
    }

    const hasAuthority = await this.userCredentialAuthorityRepository.exists({
      where: {
        userCredentialId: userCredential.id,
        authorityId: authority.id,
      },
    });

    if (!hasAuthority) {
      throw new ForbiddenException({
        code: options.authorityRequiredCode,
        message: this.i18n.translate(options.authorityRequiredMessageKey),
      });
    }
  }

  private getSecrets(credential: Credential): CloudFrontSecrets {
    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );

    return {
      accessKeyId: secrets.accessKeyId,
      secretAccessKey: secrets.secretKeyId,
    };
  }

  private normalizeDistributionId(distributionId: string): string {
    const normalizedDistributionId = distributionId.trim();

    if (!normalizedDistributionId) {
      throw new BadRequestException({
        code: 'CLOUDFRONT_DISTRIBUTION_ID_REQUIRED',
        message: this.i18n.translate('validation.required', {
          property: 'distributionId',
        }),
      });
    }

    return normalizedDistributionId;
  }

  private normalizeInvalidationPaths(paths: string[]): string[] {
    const normalizedPaths = [...new Set(paths.map((path) => path.trim()))]
      .filter(Boolean)
      .map((path) => (path.startsWith('/') ? path : `/${path}`));

    if (!normalizedPaths.length) {
      throw new BadRequestException({
        code: 'CLOUDFRONT_INVALIDATION_PATHS_REQUIRED',
        message: this.i18n.translate('cloudFront.invalidationPathsRequired'),
      });
    }

    return normalizedPaths;
  }

  private buildInvalidationBatchXml(
    paths: string[],
    callerReference: string,
  ): string {
    return [
      `<InvalidationBatch xmlns="http://cloudfront.amazonaws.com/doc/${CLOUDFRONT_API_VERSION}/">`,
      '<Paths>',
      `<Quantity>${paths.length}</Quantity>`,
      '<Items>',
      ...paths.map((path) => `<Path>${this.escapeXml(path)}</Path>`),
      '</Items>',
      '</Paths>',
      `<CallerReference>${this.escapeXml(callerReference)}</CallerReference>`,
      '</InvalidationBatch>',
    ].join('');
  }

  private async callCloudFront(options: {
    accessKeyId: string;
    secretAccessKey: string;
    method: 'GET' | 'POST';
    path: string;
    body?: string;
    contentType?: string;
  }): Promise<string> {
    const body = options.body ?? '';
    const amzDate = this.toAmzDate(new Date());
    const dateStamp = amzDate.slice(0, 8);
    const authorization = this.createAuthorizationHeader({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      method: options.method,
      path: options.path,
      amzDate,
      dateStamp,
      body,
      contentType: options.contentType,
    });
    let response: Response;

    try {
      response = await fetch(`https://${CLOUDFRONT_HOST}${options.path}`, {
        method: options.method,
        headers: {
          Authorization: authorization,
          Host: CLOUDFRONT_HOST,
          'X-Amz-Date': amzDate,
          ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
        },
        body: options.method === 'POST' ? body : undefined,
      });
    } catch {
      throw new BadRequestException({
        code: 'CLOUDFRONT_AWS_CONNECTION_FAILED',
        message: this.i18n.translate('cloudFront.awsConnectionFailed'),
      });
    }

    const responseText = await response.text();

    if (!response.ok) {
      throw new BadRequestException({
        code: 'CLOUDFRONT_AWS_REQUEST_FAILED',
        message: this.i18n.translate('cloudFront.awsRequestFailed', {
          status: response.status,
        }),
        awsMessage: this.extractAwsErrorMessage(responseText),
      });
    }

    return responseText;
  }

  private createAuthorizationHeader(options: {
    accessKeyId: string;
    secretAccessKey: string;
    method: string;
    path: string;
    amzDate: string;
    dateStamp: string;
    body: string;
    contentType?: string;
  }): string {
    const headerEntries = [
      ...(options.contentType ? [`content-type:${options.contentType}`] : []),
      `host:${CLOUDFRONT_HOST}`,
      `x-amz-date:${options.amzDate}`,
    ];
    const signedHeaders = [
      ...(options.contentType ? ['content-type'] : []),
      'host',
      'x-amz-date',
    ].join(';');
    const canonicalRequest = [
      options.method,
      options.path,
      '',
      headerEntries.join('\n'),
      '',
      signedHeaders,
      this.sha256(options.body),
    ].join('\n');
    const credentialScope = `${options.dateStamp}/${CLOUDFRONT_REGION}/${CLOUDFRONT_SERVICE}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      options.amzDate,
      credentialScope,
      this.sha256(canonicalRequest),
    ].join('\n');
    const signingKey = this.getSignatureKey(
      options.secretAccessKey,
      options.dateStamp,
      CLOUDFRONT_REGION,
      CLOUDFRONT_SERVICE,
    );
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign, 'utf8')
      .digest('hex');

    return `AWS4-HMAC-SHA256 Credential=${options.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private parseDistributions(xml: string): CloudFrontDistributionDto[] {
    const listXml = this.getSection(xml, 'DistributionList') || xml;

    return this.getSections(listXml, 'DistributionSummary').map((itemXml) =>
      this.parseDistributionSummary(itemXml),
    );
  }

  private parseDistributionDetail(xml: string): CloudFrontDistributionDto {
    return this.parseDistributionSummary(this.getSection(xml, 'Distribution') || xml);
  }

  private parseDistributionSummary(xml: string): CloudFrontDistributionDto {
    const aliasesXml = this.getDirectSection(xml, 'Aliases');
    const originsXml = this.getDirectSection(xml, 'Origins');
    const distributionConfigXml = this.getDirectSection(
      xml,
      'DistributionConfig',
    );
    const sourceXml = distributionConfigXml || xml;

    return {
      id: this.getDirectText(xml, 'Id') ?? '',
      arn: this.getDirectText(xml, 'ARN'),
      status: this.getDirectText(xml, 'Status'),
      domainName: this.getDirectText(xml, 'DomainName'),
      enabled: this.getDirectText(sourceXml, 'Enabled') === 'true',
      comment: this.getDirectText(sourceXml, 'Comment'),
      priceClass: this.getDirectText(sourceXml, 'PriceClass'),
      httpVersion: this.getDirectText(sourceXml, 'HttpVersion'),
      ipv6Enabled: this.getDirectText(sourceXml, 'IsIPV6Enabled') === 'true',
      lastModifiedTime: this.getDirectText(xml, 'LastModifiedTime'),
      aliases: this.getSections(this.getSection(aliasesXml, 'Items'), 'CNAME')
        .map((item) => this.stripTags(item))
        .filter(Boolean),
      origins: this.getSections(this.getSection(originsXml, 'Items'), 'Origin')
        .map((originXml) => this.getText(originXml, 'DomainName') ?? '')
        .filter(Boolean),
    };
  }

  private parseInvalidations(xml: string): CloudFrontInvalidationDto[] {
    const listXml = this.getSection(xml, 'InvalidationList') || xml;

    return this.getSections(listXml, 'InvalidationSummary').map((itemXml) =>
      this.parseInvalidation(itemXml),
    );
  }

  private parseInvalidation(xml: string): CloudFrontInvalidationDto {
    const invalidationXml = this.getSection(xml, 'Invalidation') || xml;

    return {
      id: this.getText(invalidationXml, 'Id') ?? '',
      status: this.getText(invalidationXml, 'Status'),
      createTime: this.getText(invalidationXml, 'CreateTime'),
    };
  }

  private getSection(xml: string | null | undefined, tag: string): string {
    if (!xml) {
      return '';
    }

    const match = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`));

    return match?.[1] ?? '';
  }

  private getDirectSection(
    xml: string | null | undefined,
    tag: string,
  ): string {
    return this.getDirectSections(xml, tag)[0] ?? '';
  }

  private getDirectSections(
    xml: string | null | undefined,
    tag: string,
  ): string[] {
    if (!xml) {
      return [];
    }

    const results: string[] = [];
    const tagPattern = /<\/?([A-Za-z0-9_:.-]+)\b[^>]*>/g;
    let depth = 0;
    let activeStart: number | null = null;

    for (const match of xml.matchAll(tagPattern)) {
      const fullTag = match[0];
      const tagName = match[1];
      const isClosing = fullTag.startsWith('</');
      const isSelfClosing = fullTag.endsWith('/>');

      if (isClosing) {
        if (activeStart !== null && tagName === tag && depth === 1) {
          results.push(xml.slice(activeStart, match.index));
          activeStart = null;
        }

        depth = Math.max(0, depth - 1);
        continue;
      }

      if (tagName === tag && depth === 0) {
        if (isSelfClosing) {
          results.push('');
        } else {
          activeStart = match.index + fullTag.length;
        }
      }

      if (!isSelfClosing) {
        depth += 1;
      }
    }

    return results;
  }

  private getSections(xml: string | null | undefined, tag: string): string[] {
    if (!xml) {
      return [];
    }

    const matches = xml.matchAll(
      new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g'),
    );

    return [...matches].map((match) => match[1]);
  }

  private getText(xml: string | null | undefined, tag: string): string | null {
    const value = this.stripTags(this.getSection(xml, tag));

    return value || null;
  }

  private getDirectText(
    xml: string | null | undefined,
    tag: string,
  ): string | null {
    const value = this.stripTags(this.getDirectSection(xml, tag));

    return value || null;
  }

  private stripTags(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return this.decodeXml(value.replace(/<[^>]+>/g, '').trim());
  }

  private extractAwsErrorMessage(xml: string): string | null {
    return this.getText(xml, 'Message') ?? this.getText(xml, 'Error');
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private decodeXml(value: string): string {
    return value
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
  }

  private toAmzDate(date: Date): string {
    return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  private hmac(key: Buffer | string, value: string): Buffer {
    return createHmac('sha256', key).update(value, 'utf8').digest();
  }

  private getSignatureKey(
    secretAccessKey: string,
    dateStamp: string,
    region: string,
    service: string,
  ): Buffer {
    const kDate = this.hmac(`AWS4${secretAccessKey}`, dateStamp);
    const kRegion = this.hmac(kDate, region);
    const kService = this.hmac(kRegion, service);

    return this.hmac(kService, 'aws4_request');
  }
}
