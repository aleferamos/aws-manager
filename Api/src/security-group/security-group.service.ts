import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac } from 'node:crypto';
import { Repository } from 'typeorm';

import { CreateInboundRuleDto } from './dto/create-inbound-rule.dto';
import { ListSecurityGroupsQueryDto } from './dto/list-security-groups-query.dto';
import {
  SecurityGroupDetailDto,
  SecurityGroupDto,
  SecurityGroupListDto,
  SecurityGroupRuleDto,
  SecurityGroupTagDto,
} from './dto/security-group.dto';
import { UpdateInboundRuleDto } from './dto/update-inbound-rule.dto';
import { Authority } from '../authority/entities/authority.entity';
import { CredentialEncryptionService } from '../credential/credential-encryption.service';
import { Credential } from '../credential/entities/credential.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';
import { UserCredential } from '../credential/entities/user-credential.entity';
import { I18nService } from '../shared/i18n/i18n.service';
import { User } from '../user/entities/user.entity';

const SECURITY_GROUP_AUTHORITY_CODE = 'AWS_SECURITY_GROUP_LIST';
const SECURITY_GROUP_ADD_RULE_AUTHORITY_CODE = 'AWS_SECURITY_GROUP_ADD_RULE';
const SECURITY_GROUP_EDIT_RULE_AUTHORITY_CODE = 'AWS_SECURITY_GROUP_EDIT_RULE';
const SECURITY_GROUP_DELETE_RULE_AUTHORITY_CODE =
  'AWS_SECURITY_GROUP_DELETE_RULE';
const EC2_SERVICE = 'ec2';
const EC2_API_VERSION = '2016-11-15';
const EC2_CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=utf-8';

type InboundRuleDefinition = {
  protocol: string;
  fromPort?: number;
  toPort?: number;
  source: string;
  description?: string;
};

type InboundRuleInput = {
  type?: string;
  protocol?: string;
  fromPort?: number;
  toPort?: number;
  source: string;
  description?: string;
};

@Injectable()
export class SecurityGroupService {
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

  async list(
    userId: string,
    query: ListSecurityGroupsQueryDto,
  ): Promise<SecurityGroupListDto> {
    const [user, credential] = await Promise.all([
      this.findUserOrFail(userId),
      this.findCredentialWithSecretsOrFail(query.credentialId),
    ]);

    if (!credential.active) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('securityGroup.credentialInactive'),
      });
    }

    await this.assertCanListSecurityGroups(user, credential.id);

    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );
    const region = query.region.trim();
    const securityGroupsXml = await this.callEc2({
      accessKeyId: secrets.accessKeyId,
      secretAccessKey: secrets.secretKeyId,
      region,
      parameters: {
        Action: 'DescribeSecurityGroups',
        Version: EC2_API_VERSION,
      },
    });

    return {
      credentialId: credential.id,
      region,
      items: this.parseSecurityGroups(securityGroupsXml),
    };
  }

  async view(
    userId: string,
    groupId: string,
    query: ListSecurityGroupsQueryDto,
  ): Promise<SecurityGroupDetailDto> {
    const securityGroupId = groupId.trim();

    if (!securityGroupId) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_ID_REQUIRED',
        message: this.i18n.translate('validation.required', {
          property: 'groupId',
        }),
      });
    }

    const [user, credential] = await Promise.all([
      this.findUserOrFail(userId),
      this.findCredentialWithSecretsOrFail(query.credentialId),
    ]);

    if (!credential.active) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('securityGroup.credentialInactive'),
      });
    }

    await this.assertCanListSecurityGroups(user, credential.id);

    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );
    const region = query.region.trim();
    const [securityGroupXml, securityGroupRulesXml] = await Promise.all([
      this.callEc2({
        accessKeyId: secrets.accessKeyId,
        secretAccessKey: secrets.secretKeyId,
        region,
        parameters: {
          Action: 'DescribeSecurityGroups',
          'GroupId.1': securityGroupId,
          Version: EC2_API_VERSION,
        },
      }),
      this.callEc2({
        accessKeyId: secrets.accessKeyId,
        secretAccessKey: secrets.secretKeyId,
        region,
        parameters: {
          Action: 'DescribeSecurityGroupRules',
          'Filter.1.Name': 'group-id',
          'Filter.1.Value.1': securityGroupId,
          Version: EC2_API_VERSION,
        },
      }),
    ]);

    return {
      credentialId: credential.id,
      region,
      ...this.parseSecurityGroupDetail(securityGroupXml, securityGroupRulesXml),
    };
  }

  async createInboundRule(
    userId: string,
    groupId: string,
    createInboundRuleDto: CreateInboundRuleDto,
  ): Promise<{ success: true; rules: SecurityGroupRuleDto[] }> {
    const securityGroupId = this.normalizeRequiredParam(groupId, 'groupId');
    const [user, credential] = await Promise.all([
      this.findUserOrFail(userId),
      this.findCredentialWithSecretsOrFail(createInboundRuleDto.credentialId),
    ]);

    if (!credential.active) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('securityGroup.credentialInactive'),
      });
    }

    await this.assertCanAddSecurityGroupRule(user, credential.id);

    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );
    const rule = this.resolveInboundRule(createInboundRuleDto);
    const responseXml = await this.callEc2({
      accessKeyId: secrets.accessKeyId,
      secretAccessKey: secrets.secretKeyId,
      region: createInboundRuleDto.region.trim(),
      parameters: {
        Action: 'AuthorizeSecurityGroupIngress',
        GroupId: securityGroupId,
        Version: EC2_API_VERSION,
        ...this.buildIpPermissionParameters(rule),
      },
    });

    return {
      success: true,
      rules: this.parseSecurityGroupRules(responseXml)
        .filter((securityGroupRule) => !securityGroupRule.isEgress)
        .map(({ isEgress: _isEgress, ...securityGroupRule }) => ({
          ...securityGroupRule,
        })),
    };
  }

  async deleteInboundRule(
    userId: string,
    groupId: string,
    ruleId: string,
    query: ListSecurityGroupsQueryDto,
  ): Promise<void> {
    const securityGroupId = this.normalizeRequiredParam(groupId, 'groupId');
    const securityGroupRuleId = this.normalizeRequiredParam(ruleId, 'ruleId');
    const [user, credential] = await Promise.all([
      this.findUserOrFail(userId),
      this.findCredentialWithSecretsOrFail(query.credentialId),
    ]);

    if (!credential.active) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('securityGroup.credentialInactive'),
      });
    }

    await this.assertCanDeleteSecurityGroupRule(user, credential.id);

    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );

    await this.callEc2({
      accessKeyId: secrets.accessKeyId,
      secretAccessKey: secrets.secretKeyId,
      region: query.region.trim(),
      parameters: {
        Action: 'RevokeSecurityGroupIngress',
        GroupId: securityGroupId,
        'SecurityGroupRuleId.1': securityGroupRuleId,
        Version: EC2_API_VERSION,
      },
    });
  }

  async updateInboundRule(
    userId: string,
    groupId: string,
    ruleId: string,
    updateInboundRuleDto: UpdateInboundRuleDto,
  ): Promise<void> {
    const securityGroupId = this.normalizeRequiredParam(groupId, 'groupId');
    const securityGroupRuleId = this.normalizeRequiredParam(ruleId, 'ruleId');
    const [user, credential] = await Promise.all([
      this.findUserOrFail(userId),
      this.findCredentialWithSecretsOrFail(updateInboundRuleDto.credentialId),
    ]);

    if (!credential.active) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('securityGroup.credentialInactive'),
      });
    }

    await this.assertCanEditSecurityGroupRule(user, credential.id);

    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );
    const rule = this.resolveInboundRule(updateInboundRuleDto);

    await this.callEc2({
      accessKeyId: secrets.accessKeyId,
      secretAccessKey: secrets.secretKeyId,
      region: updateInboundRuleDto.region.trim(),
      parameters: {
        Action: 'ModifySecurityGroupRules',
        GroupId: securityGroupId,
        Version: EC2_API_VERSION,
        ...this.buildModifySecurityGroupRuleParameters(
          securityGroupRuleId,
          rule,
        ),
      },
    });
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

  private async assertCanListSecurityGroups(
    user: User,
    credentialId: string,
  ): Promise<void> {
    if (user.isRoot) {
      return;
    }

    const authority = await this.authorityRepository.findOne({
      where: {
        code: SECURITY_GROUP_AUTHORITY_CODE,
      },
      select: {
        id: true,
      },
    });

    if (!authority) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_AUTHORITY_NOT_CONFIGURED',
        message: this.i18n.translate('securityGroup.authorityNotConfigured'),
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
        code: 'SECURITY_GROUP_CREDENTIAL_ACCESS_REQUIRED',
        message: this.i18n.translate('securityGroup.credentialAccessRequired'),
      });
    }

    const hasSecurityGroupAuthority =
      await this.userCredentialAuthorityRepository.exists({
        where: {
          userCredentialId: userCredential.id,
          authorityId: authority.id,
        },
      });

    if (!hasSecurityGroupAuthority) {
      throw new ForbiddenException({
        code: 'SECURITY_GROUP_AUTHORITY_REQUIRED',
        message: this.i18n.translate('securityGroup.authorityRequired'),
      });
    }
  }

  private async assertCanAddSecurityGroupRule(
    user: User,
    credentialId: string,
  ): Promise<void> {
    await this.assertHasCredentialAuthority({
      user,
      credentialId,
      authorityCode: SECURITY_GROUP_ADD_RULE_AUTHORITY_CODE,
      authorityNotConfiguredCode:
        'SECURITY_GROUP_ADD_RULE_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'SECURITY_GROUP_ADD_RULE_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey:
        'securityGroup.addRuleAuthorityNotConfigured',
      authorityRequiredMessageKey: 'securityGroup.addRuleAuthorityRequired',
    });
  }

  private async assertCanDeleteSecurityGroupRule(
    user: User,
    credentialId: string,
  ): Promise<void> {
    await this.assertHasCredentialAuthority({
      user,
      credentialId,
      authorityCode: SECURITY_GROUP_DELETE_RULE_AUTHORITY_CODE,
      authorityNotConfiguredCode:
        'SECURITY_GROUP_DELETE_RULE_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'SECURITY_GROUP_DELETE_RULE_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey:
        'securityGroup.deleteRuleAuthorityNotConfigured',
      authorityRequiredMessageKey: 'securityGroup.deleteRuleAuthorityRequired',
    });
  }

  private async assertCanEditSecurityGroupRule(
    user: User,
    credentialId: string,
  ): Promise<void> {
    await this.assertHasCredentialAuthority({
      user,
      credentialId,
      authorityCode: SECURITY_GROUP_EDIT_RULE_AUTHORITY_CODE,
      authorityNotConfiguredCode:
        'SECURITY_GROUP_EDIT_RULE_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'SECURITY_GROUP_EDIT_RULE_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey:
        'securityGroup.editRuleAuthorityNotConfigured',
      authorityRequiredMessageKey: 'securityGroup.editRuleAuthorityRequired',
    });
  }

  private async assertHasCredentialAuthority(options: {
    user: User;
    credentialId: string;
    authorityCode: string;
    authorityNotConfiguredCode: string;
    authorityRequiredCode: string;
    authorityNotConfiguredMessageKey:
      | 'securityGroup.addRuleAuthorityNotConfigured'
      | 'securityGroup.editRuleAuthorityNotConfigured'
      | 'securityGroup.deleteRuleAuthorityNotConfigured';
    authorityRequiredMessageKey:
      | 'securityGroup.addRuleAuthorityRequired'
      | 'securityGroup.editRuleAuthorityRequired'
      | 'securityGroup.deleteRuleAuthorityRequired';
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
        code: 'SECURITY_GROUP_CREDENTIAL_ACCESS_REQUIRED',
        message: this.i18n.translate('securityGroup.credentialAccessRequired'),
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

  private normalizeRequiredParam(value: string, property: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_REQUIRED_PARAM',
        message: this.i18n.translate('validation.required', {
          property,
        }),
      });
    }

    return normalizedValue;
  }

  private resolveInboundRule(ruleDto: InboundRuleInput): InboundRuleDefinition {
    const preset = this.getRulePreset(ruleDto.type);
    const protocol = preset?.protocol ?? ruleDto.protocol;
    const fromPort = preset?.fromPort ?? ruleDto.fromPort;
    const toPort = preset?.toPort ?? ruleDto.toPort ?? fromPort;
    const source = ruleDto.source.trim();
    const description = ruleDto.description?.trim();

    if (!protocol || !source) {
      throw this.invalidInboundRuleException();
    }

    if (protocol !== '-1') {
      if (fromPort === undefined || toPort === undefined) {
        throw this.invalidInboundRuleException();
      }

      if (fromPort > toPort) {
        throw this.invalidInboundRuleException();
      }
    }

    return {
      protocol,
      fromPort,
      toPort,
      source,
      description: description || undefined,
    };
  }

  private getRulePreset(
    type: string | undefined,
  ): Pick<InboundRuleDefinition, 'protocol' | 'fromPort' | 'toPort'> | null {
    const normalizedType = type?.trim().toUpperCase();

    if (!normalizedType) {
      return null;
    }

    const presets = new Map<
      string,
      Pick<InboundRuleDefinition, 'protocol' | 'fromPort' | 'toPort'>
    >([
      ['ALL TRAFFIC', { protocol: '-1' }],
      ['ALL TCP', { protocol: 'tcp', fromPort: 0, toPort: 65535 }],
      ['ALL UDP', { protocol: 'udp', fromPort: 0, toPort: 65535 }],
      ['ALL ICMP - IPV4', { protocol: 'icmp', fromPort: -1, toPort: -1 }],
      ['ALL ICMP - IPV6', { protocol: 'icmpv6', fromPort: -1, toPort: -1 }],
      ['CUSTOM TCP', { protocol: 'tcp' }],
      ['CUSTOM UDP', { protocol: 'udp' }],
      ['CUSTOM ICMP', { protocol: 'icmp' }],
      ['CUSTOM ICMP - IPV4', { protocol: 'icmp' }],
      ['SSH', { protocol: 'tcp', fromPort: 22, toPort: 22 }],
      ['SMTP', { protocol: 'tcp', fromPort: 25, toPort: 25 }],
      ['DNS', { protocol: 'tcp', fromPort: 53, toPort: 53 }],
      ['DNS (TCP)', { protocol: 'tcp', fromPort: 53, toPort: 53 }],
      ['DNS (UDP)', { protocol: 'udp', fromPort: 53, toPort: 53 }],
      ['HTTP', { protocol: 'tcp', fromPort: 80, toPort: 80 }],
      ['POP3', { protocol: 'tcp', fromPort: 110, toPort: 110 }],
      ['IMAP', { protocol: 'tcp', fromPort: 143, toPort: 143 }],
      ['LDAP', { protocol: 'tcp', fromPort: 389, toPort: 389 }],
      ['HTTPS', { protocol: 'tcp', fromPort: 443, toPort: 443 }],
      ['SMB', { protocol: 'tcp', fromPort: 445, toPort: 445 }],
      ['SMTPS', { protocol: 'tcp', fromPort: 465, toPort: 465 }],
      ['IMAPS', { protocol: 'tcp', fromPort: 993, toPort: 993 }],
      ['POP3S', { protocol: 'tcp', fromPort: 995, toPort: 995 }],
      ['MSSQL', { protocol: 'tcp', fromPort: 1433, toPort: 1433 }],
      ['NFS', { protocol: 'tcp', fromPort: 2049, toPort: 2049 }],
      ['MYSQL/AURORA', { protocol: 'tcp', fromPort: 3306, toPort: 3306 }],
      ['RDP', { protocol: 'tcp', fromPort: 3389, toPort: 3389 }],
      ['POSTGRESQL', { protocol: 'tcp', fromPort: 5432, toPort: 5432 }],
      ['REDSHIFT', { protocol: 'tcp', fromPort: 5439, toPort: 5439 }],
      ['ORACLE-RDS', { protocol: 'tcp', fromPort: 1521, toPort: 1521 }],
      ['WINRM-HTTP', { protocol: 'tcp', fromPort: 5985, toPort: 5985 }],
      ['WINRM-HTTPS', { protocol: 'tcp', fromPort: 5986, toPort: 5986 }],
      ['ELASTIC GRAPHICS', { protocol: 'tcp', fromPort: 2007, toPort: 2007 }],
      ['CQLSH / CASSANDRA', { protocol: 'tcp', fromPort: 9042, toPort: 9042 }],
    ]);

    return presets.get(normalizedType) ?? null;
  }

  private buildIpPermissionParameters(
    rule: InboundRuleDefinition,
  ): Record<string, string> {
    const parameters: Record<string, string> = {
      'IpPermissions.1.IpProtocol': rule.protocol,
    };

    if (rule.protocol !== '-1') {
      parameters['IpPermissions.1.FromPort'] = String(rule.fromPort);
      parameters['IpPermissions.1.ToPort'] = String(rule.toPort);
    }

    if (rule.source.startsWith('sg-')) {
      parameters['IpPermissions.1.UserIdGroupPairs.1.GroupId'] = rule.source;

      if (rule.description) {
        parameters['IpPermissions.1.UserIdGroupPairs.1.Description'] =
          rule.description;
      }

      return parameters;
    }

    if (rule.source.startsWith('pl-')) {
      parameters['IpPermissions.1.PrefixListIds.1.PrefixListId'] = rule.source;

      if (rule.description) {
        parameters['IpPermissions.1.PrefixListIds.1.Description'] =
          rule.description;
      }

      return parameters;
    }

    if (rule.source.includes(':')) {
      parameters['IpPermissions.1.Ipv6Ranges.1.CidrIpv6'] = rule.source;

      if (rule.description) {
        parameters['IpPermissions.1.Ipv6Ranges.1.Description'] =
          rule.description;
      }

      return parameters;
    }

    parameters['IpPermissions.1.IpRanges.1.CidrIp'] = rule.source;

    if (rule.description) {
      parameters['IpPermissions.1.IpRanges.1.Description'] = rule.description;
    }

    return parameters;
  }

  private buildModifySecurityGroupRuleParameters(
    ruleId: string,
    rule: InboundRuleDefinition,
  ): Record<string, string> {
    const parameters: Record<string, string> = {
      'SecurityGroupRule.1.SecurityGroupRuleId': ruleId,
      'SecurityGroupRule.1.SecurityGroupRule.IpProtocol': rule.protocol,
      'SecurityGroupRule.1.SecurityGroupRule.Description':
        rule.description ?? '',
    };

    if (rule.protocol !== '-1') {
      parameters['SecurityGroupRule.1.SecurityGroupRule.FromPort'] = String(
        rule.fromPort,
      );
      parameters['SecurityGroupRule.1.SecurityGroupRule.ToPort'] = String(
        rule.toPort,
      );
    }

    if (rule.source.startsWith('sg-')) {
      parameters['SecurityGroupRule.1.SecurityGroupRule.ReferencedGroupId'] =
        rule.source;
      return parameters;
    }

    if (rule.source.startsWith('pl-')) {
      parameters['SecurityGroupRule.1.SecurityGroupRule.PrefixListId'] =
        rule.source;
      return parameters;
    }

    if (rule.source.includes(':')) {
      parameters['SecurityGroupRule.1.SecurityGroupRule.CidrIpv6'] =
        rule.source;
      return parameters;
    }

    parameters['SecurityGroupRule.1.SecurityGroupRule.CidrIpv4'] = rule.source;

    return parameters;
  }

  private invalidInboundRuleException(): BadRequestException {
    return new BadRequestException({
      code: 'SECURITY_GROUP_INVALID_INBOUND_RULE',
      message: this.i18n.translate('securityGroup.invalidInboundRule'),
    });
  }

  private async callEc2(options: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    parameters: Record<string, string>;
  }): Promise<string> {
    const host = `ec2.${options.region}.amazonaws.com`;
    const endpoint = `https://${host}/`;
    const body = new URLSearchParams(options.parameters).toString();
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
          'Content-Type': EC2_CONTENT_TYPE,
          Host: host,
          'X-Amz-Date': amzDate,
        },
        body,
      });
    } catch {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_AWS_CONNECTION_FAILED',
        message: this.i18n.translate('securityGroup.awsConnectionFailed'),
      });
    }

    const responseText = await response.text();

    if (!response.ok) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_AWS_REQUEST_FAILED',
        message: this.i18n.translate('securityGroup.awsRequestFailed', {
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
    region: string;
    host: string;
    amzDate: string;
    dateStamp: string;
    body: string;
  }): string {
    const canonicalHeaders = [
      `content-type:${EC2_CONTENT_TYPE}`,
      `host:${options.host}`,
      `x-amz-date:${options.amzDate}`,
    ].join('\n');
    const signedHeaders = 'content-type;host;x-amz-date';
    const canonicalRequest = [
      'POST',
      '/',
      '',
      canonicalHeaders,
      '',
      signedHeaders,
      this.sha256(options.body),
    ].join('\n');
    const credentialScope = `${options.dateStamp}/${options.region}/${EC2_SERVICE}/aws4_request`;
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
      EC2_SERVICE,
    );
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign, 'utf8')
      .digest('hex');

    return `AWS4-HMAC-SHA256 Credential=${options.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private parseSecurityGroups(xml: string): SecurityGroupDto[] {
    const securityGroupInfo = this.getSection(xml, 'securityGroupInfo');

    return this.getTopLevelItems(securityGroupInfo).map((securityGroupXml) => ({
      name: this.getTagValue(securityGroupXml, 'Name'),
      groupId: this.getText(securityGroupXml, 'groupId') ?? '',
      groupName: this.getText(securityGroupXml, 'groupName'),
      description: this.getText(securityGroupXml, 'groupDescription'),
      vpcId: this.getText(securityGroupXml, 'vpcId'),
      ownerId: this.getText(securityGroupXml, 'ownerId'),
      inboundRuleCount: this.countItems(
        this.getSection(securityGroupXml, 'ipPermissions'),
      ),
      outboundRuleCount: this.countItems(
        this.getSection(securityGroupXml, 'ipPermissionsEgress'),
      ),
    }));
  }

  private parseSecurityGroupDetail(
    securityGroupXml: string,
    securityGroupRulesXml: string,
  ): Pick<
    SecurityGroupDetailDto,
    'securityGroup' | 'inboundRules' | 'outboundRules' | 'tags'
  > {
    const securityGroups = this.parseSecurityGroups(securityGroupXml);
    const securityGroup = securityGroups[0];

    if (!securityGroup) {
      throw new BadRequestException({
        code: 'SECURITY_GROUP_NOT_FOUND',
        message: this.i18n.translate('securityGroup.notFound'),
      });
    }

    const securityGroupInfo = this.getSection(
      securityGroupXml,
      'securityGroupInfo',
    );
    const securityGroupItemXml = this.getTopLevelItems(securityGroupInfo)[0];
    const rules = this.parseSecurityGroupRules(securityGroupRulesXml);
    const inboundRules = rules.filter((rule) => !rule.isEgress);
    const outboundRules = rules.filter((rule) => rule.isEgress);

    return {
      securityGroup,
      inboundRules: inboundRules.map(
        ({ isEgress: _isEgress, ...rule }) => rule,
      ),
      outboundRules: outboundRules.map(
        ({ isEgress: _isEgress, ...rule }) => rule,
      ),
      tags: securityGroupItemXml ? this.parseTags(securityGroupItemXml) : [],
    };
  }

  private parseSecurityGroupRules(
    xml: string,
  ): Array<SecurityGroupRuleDto & { isEgress: boolean }> {
    const securityGroupRuleSet = this.getSection(xml, 'securityGroupRuleSet');

    return this.getTopLevelItems(securityGroupRuleSet).map((ruleXml) => {
      const protocol = this.getText(ruleXml, 'ipProtocol');
      const fromPort = this.getText(ruleXml, 'fromPort');
      const toPort = this.getText(ruleXml, 'toPort');
      const isEgress = this.getText(ruleXml, 'isEgress') === 'true';
      const target = this.getRuleTarget(ruleXml);

      return {
        name: this.getTagValue(ruleXml, 'Name'),
        securityGroupRuleId: this.getText(ruleXml, 'securityGroupRuleId') ?? '',
        ipVersion: this.getIpVersion(ruleXml),
        type: this.getRuleType(protocol, fromPort, toPort),
        protocol: this.formatProtocol(protocol),
        portRange: this.formatPortRange(protocol, fromPort, toPort),
        source: isEgress ? null : target,
        destination: isEgress ? target : null,
        description: this.getText(ruleXml, 'description'),
        isEgress,
      };
    });
  }

  private parseTags(xml: string): SecurityGroupTagDto[] {
    const tagSet = this.getSection(xml, 'tagSet');

    return this.getTopLevelItems(tagSet)
      .map((tag) => {
        const key = this.getText(tag, 'key');

        if (!key) {
          return null;
        }

        return {
          key,
          value: this.getText(tag, 'value'),
        };
      })
      .filter((tag): tag is SecurityGroupTagDto => Boolean(tag));
  }

  private getIpVersion(ruleXml: string): string | null {
    if (this.getText(ruleXml, 'cidrIpv4')) {
      return 'IPv4';
    }

    if (this.getText(ruleXml, 'cidrIpv6')) {
      return 'IPv6';
    }

    return null;
  }

  private getRuleTarget(ruleXml: string): string | null {
    const referencedGroupInfo = this.getSection(ruleXml, 'referencedGroupInfo');

    return (
      this.getText(ruleXml, 'cidrIpv4') ??
      this.getText(ruleXml, 'cidrIpv6') ??
      this.getText(ruleXml, 'prefixListId') ??
      this.getText(referencedGroupInfo, 'groupId')
    );
  }

  private getRuleType(
    protocol: string | null,
    fromPort: string | null,
    toPort: string | null,
  ): string {
    if (protocol === '-1') {
      return 'All traffic';
    }

    if (protocol === 'tcp') {
      const commonTcpTypes = new Map<string, string>([
        ['22', 'SSH'],
        ['25', 'SMTP'],
        ['53', 'DNS'],
        ['80', 'HTTP'],
        ['443', 'HTTPS'],
        ['3306', 'MYSQL/Aurora'],
        ['3389', 'RDP'],
        ['5432', 'PostgreSQL'],
      ]);

      if (fromPort && fromPort === toPort && commonTcpTypes.has(fromPort)) {
        return commonTcpTypes.get(fromPort)!;
      }

      return 'Custom TCP';
    }

    if (protocol === 'udp') {
      return fromPort === '53' && toPort === '53' ? 'DNS' : 'Custom UDP';
    }

    if (protocol === 'icmp') {
      return 'All ICMP - IPv4';
    }

    if (protocol === 'icmpv6') {
      return 'All ICMP - IPv6';
    }

    return protocol ? `Custom ${protocol.toUpperCase()}` : 'Custom';
  }

  private formatProtocol(protocol: string | null): string {
    if (protocol === '-1') {
      return 'All';
    }

    if (protocol === 'tcp') {
      return 'TCP';
    }

    if (protocol === 'udp') {
      return 'UDP';
    }

    if (protocol === 'icmp') {
      return 'ICMP';
    }

    if (protocol === 'icmpv6') {
      return 'ICMPv6';
    }

    return protocol?.toUpperCase() ?? 'All';
  }

  private formatPortRange(
    protocol: string | null,
    fromPort: string | null,
    toPort: string | null,
  ): string {
    if (protocol === '-1' || (!fromPort && !toPort)) {
      return 'All';
    }

    if (fromPort && fromPort === toPort) {
      return fromPort;
    }

    return `${fromPort ?? 'All'}-${toPort ?? 'All'}`;
  }

  private getTagValue(xml: string, key: string): string | null {
    const tagSet = this.getSection(xml, 'tagSet');

    for (const tag of this.getTopLevelItems(tagSet)) {
      if (this.getText(tag, 'key') === key) {
        return this.getText(tag, 'value');
      }
    }

    return null;
  }

  private countItems(xml: string): number {
    return this.getTopLevelItems(xml).length;
  }

  private getSection(xml: string, tagName: string): string {
    const match = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`).exec(xml);

    return match?.[1] ?? '';
  }

  private getText(xml: string, tagName: string): string | null {
    const match = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`).exec(xml);
    const value = match?.[1];

    return value ? this.decodeXml(value) : null;
  }

  private getTopLevelItems(xml: string): string[] {
    const items: string[] = [];
    const tokenPattern = /<\/?item>/g;
    let depth = 0;
    let itemStart = -1;
    let match: RegExpExecArray | null;

    while ((match = tokenPattern.exec(xml))) {
      if (match[0] === '<item>') {
        if (depth === 0) {
          itemStart = tokenPattern.lastIndex;
        }

        depth += 1;
        continue;
      }

      depth -= 1;

      if (depth === 0 && itemStart >= 0) {
        items.push(xml.slice(itemStart, match.index));
        itemStart = -1;
      }
    }

    return items;
  }

  private decodeXml(value: string): string {
    return value
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
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

  private hmac(key: string | Buffer, value: string): Buffer {
    return createHmac('sha256', key).update(value, 'utf8').digest();
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  private toAmzDate(date: Date): string {
    return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  private extractAwsErrorMessage(responseText: string): string | null {
    const message = this.getText(responseText, 'Message');

    return message ?? (responseText || null);
  }
}
