import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac } from 'node:crypto';
import { Repository } from 'typeorm';

import {
  Ec2ElasticIpDto,
  Ec2InstanceDetailDto,
  Ec2InstanceDto,
  Ec2InstanceListDto,
  Ec2SecurityGroupDto,
} from './dto/ec2-instance.dto';
import { ListEc2QueryDto } from './dto/list-ec2-query.dto';
import { Authority } from '../authority/entities/authority.entity';
import { CredentialEncryptionService } from '../credential/credential-encryption.service';
import { Credential } from '../credential/entities/credential.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';
import { UserCredential } from '../credential/entities/user-credential.entity';
import { I18nService } from '../shared/i18n/i18n.service';
import { User } from '../user/entities/user.entity';

const EC2_AUTHORITY_CODE = 'AWS_EC2_LIST';
const EC2_SERVICE = 'ec2';
const EC2_API_VERSION = '2016-11-15';
const EC2_CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=utf-8';

@Injectable()
export class Ec2Service {
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
    query: ListEc2QueryDto,
  ): Promise<Ec2InstanceListDto> {
    const [user, credential] = await Promise.all([
      this.findUserOrFail(userId),
      this.findCredentialWithSecretsOrFail(query.credentialId),
    ]);

    if (!credential.active) {
      throw new BadRequestException({
        code: 'EC2_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('ec2.credentialInactive'),
      });
    }

    await this.assertCanListEc2(user, credential.id);

    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );
    const region = query.region.trim();
    const [instancesXml, statusesXml] = await Promise.all([
      this.callEc2({
        accessKeyId: secrets.accessKeyId,
        secretAccessKey: secrets.secretKeyId,
        region,
        parameters: {
          Action: 'DescribeInstances',
          Version: EC2_API_VERSION,
        },
      }),
      this.callEc2({
        accessKeyId: secrets.accessKeyId,
        secretAccessKey: secrets.secretKeyId,
        region,
        parameters: {
          Action: 'DescribeInstanceStatus',
          IncludeAllInstances: 'true',
          Version: EC2_API_VERSION,
        },
      }),
    ]);

    return {
      credentialId: credential.id,
      region,
      items: this.parseInstances(instancesXml, statusesXml),
    };
  }

  async view(
    userId: string,
    instanceId: string,
    query: ListEc2QueryDto,
  ): Promise<Ec2InstanceDetailDto> {
    const ec2InstanceId = instanceId.trim();

    if (!ec2InstanceId) {
      throw new BadRequestException({
        code: 'EC2_INSTANCE_ID_REQUIRED',
        message: this.i18n.translate('validation.required', {
          property: 'instanceId',
        }),
      });
    }

    const [user, credential] = await Promise.all([
      this.findUserOrFail(userId),
      this.findCredentialWithSecretsOrFail(query.credentialId),
    ]);

    if (!credential.active) {
      throw new BadRequestException({
        code: 'EC2_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('ec2.credentialInactive'),
      });
    }

    await this.assertCanListEc2(user, credential.id);

    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );
    const region = query.region.trim();
    const [instancesXml, addressesXml] = await Promise.all([
      this.callEc2({
        accessKeyId: secrets.accessKeyId,
        secretAccessKey: secrets.secretKeyId,
        region,
        parameters: {
          Action: 'DescribeInstances',
          'InstanceId.1': ec2InstanceId,
          Version: EC2_API_VERSION,
        },
      }),
      this.callEc2({
        accessKeyId: secrets.accessKeyId,
        secretAccessKey: secrets.secretKeyId,
        region,
        parameters: {
          Action: 'DescribeAddresses',
          'Filter.1.Name': 'instance-id',
          'Filter.1.Value.1': ec2InstanceId,
          Version: EC2_API_VERSION,
        },
      }),
    ]);
    const detail = this.parseInstanceDetail(instancesXml, addressesXml, region);
    const [securityGroupsXml, imageXml] = await Promise.all([
      detail.securityGroups.length
        ? this.callEc2({
            accessKeyId: secrets.accessKeyId,
            secretAccessKey: secrets.secretKeyId,
            region,
            parameters: {
              Action: 'DescribeSecurityGroups',
              Version: EC2_API_VERSION,
              ...this.toIndexedParameters(
                'GroupId',
                detail.securityGroups.map((securityGroup) => securityGroup.groupId),
              ),
            },
          }).catch(() => null)
        : Promise.resolve(null),
      detail.imageId
        ? this.callEc2({
            accessKeyId: secrets.accessKeyId,
            secretAccessKey: secrets.secretKeyId,
            region,
            parameters: {
              Action: 'DescribeImages',
              Version: EC2_API_VERSION,
              'ImageId.1': detail.imageId,
            },
          }).catch(() => null)
        : Promise.resolve(null),
    ]);
    const imageInfo = this.parseImageInfo(imageXml);
    const sshUsername = this.guessSshUsername({
      imageName: imageInfo.name,
      imageDescription: imageInfo.description,
      platform: detail.platform,
    });
    const sshHost = detail.publicDns ?? detail.publicIpv4Address;

    return {
      credentialId: credential.id,
      region,
      ...detail,
      imageName: imageInfo.name,
      sshUsername,
      sshCommand:
        detail.keyName && sshHost && sshUsername
          ? `ssh -i "${detail.keyName}.pem" ${sshUsername}@${sshHost}`
          : null,
      sshKeyPermissionCommand: detail.keyName
        ? `chmod 400 "${detail.keyName}.pem"`
        : null,
      sshPortOpen: securityGroupsXml
        ? this.hasSshPortOpen(securityGroupsXml)
        : null,
    };
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

  private async assertCanListEc2(
    user: User,
    credentialId: string,
  ): Promise<void> {
    if (user.isRoot) {
      return;
    }

    const authority = await this.authorityRepository.findOne({
      where: {
        code: EC2_AUTHORITY_CODE,
      },
      select: {
        id: true,
      },
    });

    if (!authority) {
      throw new BadRequestException({
        code: 'EC2_AUTHORITY_NOT_CONFIGURED',
        message: this.i18n.translate('ec2.authorityNotConfigured'),
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
        code: 'EC2_CREDENTIAL_ACCESS_REQUIRED',
        message: this.i18n.translate('ec2.credentialAccessRequired'),
      });
    }

    const hasEc2Authority = await this.userCredentialAuthorityRepository.exists(
      {
        where: {
          userCredentialId: userCredential.id,
          authorityId: authority.id,
        },
      },
    );

    if (!hasEc2Authority) {
      throw new ForbiddenException({
        code: 'EC2_AUTHORITY_REQUIRED',
        message: this.i18n.translate('ec2.authorityRequired'),
      });
    }
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
        code: 'EC2_AWS_CONNECTION_FAILED',
        message: this.i18n.translate('ec2.awsConnectionFailed'),
      });
    }

    const responseText = await response.text();

    if (!response.ok) {
      throw new BadRequestException({
        code: 'EC2_AWS_REQUEST_FAILED',
        message: this.i18n.translate('ec2.awsRequestFailed', {
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

  private parseInstances(
    instancesXml: string,
    statusesXml: string,
  ): Ec2InstanceDto[] {
    const statusesByInstanceId = this.parseStatuses(statusesXml);
    const reservationSet = this.getSection(instancesXml, 'reservationSet');
    const reservations = this.getTopLevelItems(reservationSet);

    return reservations.flatMap((reservation) => {
      const instancesSet = this.getSection(reservation, 'instancesSet');

      return this.getTopLevelItems(instancesSet).map((instanceXml) => {
        const instanceId = this.getText(instanceXml, 'instanceId') ?? '';
        const status = statusesByInstanceId.get(instanceId);

        return {
          name: this.getTagValue(instanceXml, 'Name'),
          instanceId,
          instanceState: this.getText(
            this.getSection(instanceXml, 'instanceState'),
            'name',
          ),
          instanceType: this.getText(instanceXml, 'instanceType'),
          statusCheck: status ?? null,
          availabilityZone: this.getText(
            this.getSection(instanceXml, 'placement'),
            'availabilityZone',
          ),
          publicIpv4: this.getPublicIpv4(instanceXml),
          elasticIp: this.getElasticIp(instanceXml),
          platform:
            this.getText(instanceXml, 'platformDetails') ??
            this.getText(instanceXml, 'platform') ??
            'Linux/UNIX',
        };
      });
    });
  }

  private parseInstanceDetail(
    instancesXml: string,
    addressesXml: string,
    region: string,
  ): Omit<Ec2InstanceDetailDto, 'credentialId' | 'region'> {
    const reservationSet = this.getSection(instancesXml, 'reservationSet');
    const reservation = this.getTopLevelItems(reservationSet)[0];
    const instanceXml = reservation
      ? this.getTopLevelItems(this.getSection(reservation, 'instancesSet'))[0]
      : null;

    if (!reservation || !instanceXml) {
      throw new BadRequestException({
        code: 'EC2_INSTANCE_NOT_FOUND',
        message: this.i18n.translate('ec2.notFound'),
      });
    }

    const instanceId = this.getText(instanceXml, 'instanceId') ?? '';
    const ownerId = this.getText(reservation, 'ownerId');
    const iamInstanceProfileArn = this.getText(
      this.getSection(instanceXml, 'iamInstanceProfile'),
      'arn',
    );
    const metadataOptions = this.getSection(instanceXml, 'metadataOptions');
    const privateDnsNameOptions = this.getSection(
      instanceXml,
      'privateDnsNameOptions',
    );
    const privateIpv4Addresses = this.getPrivateIpv4Addresses(instanceXml);
    const elasticIpAddresses = this.parseElasticIpAddresses(addressesXml);

    return {
      name: this.getTagValue(instanceXml, 'Name'),
      instanceId,
      imageId: this.getText(instanceXml, 'imageId'),
      imageName: null,
      publicIpv4Address: this.getPublicIpv4(instanceXml),
      privateIpv4Addresses,
      ipv6Addresses: this.getIpv6Addresses(instanceXml),
      publicDns: this.getText(instanceXml, 'dnsName'),
      privateDnsName: this.getText(instanceXml, 'privateDnsName'),
      instanceState: this.getText(
        this.getSection(instanceXml, 'instanceState'),
        'name',
      ),
      instanceType: this.getText(instanceXml, 'instanceType'),
      vpcId: this.getText(instanceXml, 'vpcId'),
      subnetId: this.getText(instanceXml, 'subnetId'),
      instanceArn:
        ownerId && instanceId
          ? `arn:aws:ec2:${region}:${ownerId}:instance/${instanceId}`
          : null,
      platform:
        this.getText(instanceXml, 'platformDetails') ??
        this.getText(instanceXml, 'platform') ??
        'Linux/UNIX',
      availabilityZone: this.getText(
        this.getSection(instanceXml, 'placement'),
        'availabilityZone',
      ),
      launchTime: this.getText(instanceXml, 'launchTime'),
      ownerId,
      keyName: this.getText(instanceXml, 'keyName'),
      iamRole: this.getIamRoleName(iamInstanceProfileArn),
      iamInstanceProfileArn,
      sshUsername: null,
      sshCommand: null,
      sshKeyPermissionCommand: null,
      sshPortOpen: null,
      hostnameType:
        this.getText(privateDnsNameOptions, 'hostnameType') ??
        this.getText(instanceXml, 'privateDnsName'),
      privateResourceDnsNameAnswer: this.getPrivateResourceDnsNameAnswer(
        privateDnsNameOptions,
      ),
      autoAssignedIpAddress: this.getAutoAssignedIpAddress(instanceXml),
      imdsv2: this.formatImdsv2(this.getText(metadataOptions, 'httpTokens')),
      operator: this.getTagValue(instanceXml, 'Operator'),
      autoScalingGroupName: this.getTagValue(
        instanceXml,
        'aws:autoscaling:groupName',
      ),
      managed: this.getText(instanceXml, 'managed') === 'true',
      elasticIpAddresses,
      securityGroups: this.getSecurityGroups(instanceXml),
    };
  }

  private toIndexedParameters(
    name: string,
    values: string[],
  ): Record<string, string> {
    return Object.fromEntries(
      values.map((value, index) => [`${name}.${index + 1}`, value]),
    );
  }

  private parseImageInfo(imageXml: string | null): {
    name: string | null;
    description: string | null;
  } {
    if (!imageXml) {
      return {
        name: null,
        description: null,
      };
    }

    const imagesSet = this.getSection(imageXml, 'imagesSet');
    const image = this.getTopLevelItems(imagesSet)[0];

    return {
      name: image ? this.getText(image, 'name') : null,
      description: image ? this.getText(image, 'description') : null,
    };
  }

  private guessSshUsername(options: {
    imageName: string | null;
    imageDescription: string | null;
    platform: string | null;
  }): string | null {
    const source = [
      options.imageName,
      options.imageDescription,
      options.platform,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!source) {
      return null;
    }

    if (source.includes('windows')) {
      return 'Administrator';
    }

    if (source.includes('ubuntu')) {
      return 'ubuntu';
    }

    if (source.includes('debian')) {
      return 'admin';
    }

    if (source.includes('centos')) {
      return 'centos';
    }

    if (source.includes('fedora')) {
      return 'fedora';
    }

    if (source.includes('bitnami')) {
      return 'bitnami';
    }

    if (source.includes('suse')) {
      return 'ec2-user';
    }

    return 'ec2-user';
  }

  private hasSshPortOpen(securityGroupsXml: string): boolean {
    const securityGroupInfo = this.getSection(
      securityGroupsXml,
      'securityGroupInfo',
    );

    for (const securityGroupXml of this.getTopLevelItems(securityGroupInfo)) {
      const ipPermissions = this.getSection(securityGroupXml, 'ipPermissions');

      for (const permissionXml of this.getTopLevelItems(ipPermissions)) {
        const protocol = this.getText(permissionXml, 'ipProtocol');
        const fromPort = Number(this.getText(permissionXml, 'fromPort'));
        const toPort = Number(this.getText(permissionXml, 'toPort'));

        if (protocol === '-1') {
          return true;
        }

        if (
          protocol === 'tcp' &&
          Number.isFinite(fromPort) &&
          Number.isFinite(toPort) &&
          fromPort <= 22 &&
          toPort >= 22
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private parseElasticIpAddresses(addressesXml: string): Ec2ElasticIpDto[] {
    const addressesSet = this.getSection(addressesXml, 'addressesSet');

    return this.getTopLevelItems(addressesSet).flatMap((addressXml) => {
      const publicIp = this.getText(addressXml, 'publicIp');

      if (!publicIp) {
        return [];
      }

      return [
        {
          publicIp,
          name: this.getTagValue(addressXml, 'Name'),
          allocationId: this.getText(addressXml, 'allocationId'),
          associationId: this.getText(addressXml, 'associationId'),
        },
      ];
    });
  }

  private getSecurityGroups(instanceXml: string): Ec2SecurityGroupDto[] {
    const securityGroups = new Map<string, Ec2SecurityGroupDto>();
    const groupSet = this.getSection(instanceXml, 'groupSet');

    for (const groupXml of this.getTopLevelItems(groupSet)) {
      const groupId = this.getText(groupXml, 'groupId');

      if (groupId) {
        securityGroups.set(groupId, {
          groupId,
          groupName: this.getText(groupXml, 'groupName'),
        });
      }
    }

    const networkInterfaceSet = this.getSection(
      instanceXml,
      'networkInterfaceSet',
    );

    for (const networkInterface of this.getTopLevelItems(networkInterfaceSet)) {
      const networkInterfaceGroupSet = this.getSection(
        networkInterface,
        'groupSet',
      );

      for (const groupXml of this.getTopLevelItems(networkInterfaceGroupSet)) {
        const groupId = this.getText(groupXml, 'groupId');

        if (groupId && !securityGroups.has(groupId)) {
          securityGroups.set(groupId, {
            groupId,
            groupName: this.getText(groupXml, 'groupName'),
          });
        }
      }
    }

    return Array.from(securityGroups.values());
  }

  private getPrivateIpv4Addresses(instanceXml: string): string[] {
    const privateIps = new Set<string>();
    const networkInterfaceSet = this.getSection(
      instanceXml,
      'networkInterfaceSet',
    );

    for (const networkInterface of this.getTopLevelItems(networkInterfaceSet)) {
      const privateIpAddressesSet = this.getSection(
        networkInterface,
        'privateIpAddressesSet',
      );

      for (const privateIpAddress of this.getTopLevelItems(
        privateIpAddressesSet,
      )) {
        const ip = this.getText(privateIpAddress, 'privateIpAddress');

        if (ip) {
          privateIps.add(ip);
        }
      }
    }

    const privateIpAddress = this.getText(instanceXml, 'privateIpAddress');

    if (privateIpAddress) {
      privateIps.add(privateIpAddress);
    }

    return Array.from(privateIps);
  }

  private getIpv6Addresses(instanceXml: string): string[] {
    const ipv6Addresses = new Set<string>();
    const networkInterfaceSet = this.getSection(
      instanceXml,
      'networkInterfaceSet',
    );

    for (const networkInterface of this.getTopLevelItems(networkInterfaceSet)) {
      const ipv6AddressesSet = this.getSection(
        networkInterface,
        'ipv6AddressesSet',
      );

      for (const ipv6Address of this.getTopLevelItems(ipv6AddressesSet)) {
        const ip = this.getText(ipv6Address, 'ipv6Address');

        if (ip) {
          ipv6Addresses.add(ip);
        }
      }
    }

    return Array.from(ipv6Addresses);
  }

  private getIamRoleName(iamInstanceProfileArn: string | null): string | null {
    return iamInstanceProfileArn?.split('/').at(-1) ?? null;
  }

  private getPrivateResourceDnsNameAnswer(
    privateDnsNameOptionsXml: string,
  ): string | null {
    const enableResourceNameDnsARecord = this.getText(
      privateDnsNameOptionsXml,
      'enableResourceNameDnsARecord',
    );
    const enableResourceNameDnsAAAARecord = this.getText(
      privateDnsNameOptionsXml,
      'enableResourceNameDnsAAAARecord',
    );

    if (enableResourceNameDnsARecord === 'true') {
      return 'IPv4 (A)';
    }

    if (enableResourceNameDnsAAAARecord === 'true') {
      return 'IPv6 (AAAA)';
    }

    return null;
  }

  private getAutoAssignedIpAddress(instanceXml: string): string | null {
    const publicIp = this.getText(instanceXml, 'ipAddress');

    if (!publicIp) {
      return null;
    }

    return this.getElasticIp(instanceXml) === publicIp ? null : publicIp;
  }

  private formatImdsv2(httpTokens: string | null): string | null {
    if (httpTokens === 'required') {
      return 'Required';
    }

    if (httpTokens === 'optional') {
      return 'Optional';
    }

    return httpTokens;
  }

  private parseStatuses(statusesXml: string): Map<string, string> {
    const statusesByInstanceId = new Map<string, string>();
    const statusSet = this.getSection(statusesXml, 'instanceStatusSet');

    for (const statusItem of this.getTopLevelItems(statusSet)) {
      const instanceId = this.getText(statusItem, 'instanceId');
      const systemStatus = this.getText(
        this.getSection(statusItem, 'systemStatus'),
        'status',
      );
      const instanceStatus = this.getText(
        this.getSection(statusItem, 'instanceStatus'),
        'status',
      );

      if (!instanceId) {
        continue;
      }

      statusesByInstanceId.set(
        instanceId,
        this.formatStatusCheck(systemStatus, instanceStatus),
      );
    }

    return statusesByInstanceId;
  }

  private formatStatusCheck(
    systemStatus: string | null,
    instanceStatus: string | null,
  ): string {
    if (systemStatus === 'ok' && instanceStatus === 'ok') {
      return '2/2 checks passed';
    }

    if (!systemStatus && !instanceStatus) {
      return 'Not available';
    }

    return `${systemStatus ?? 'unknown'} / ${instanceStatus ?? 'unknown'}`;
  }

  private getElasticIp(instanceXml: string): string | null {
    const networkInterfaceSet = this.getSection(
      instanceXml,
      'networkInterfaceSet',
    );

    for (const networkInterface of this.getTopLevelItems(networkInterfaceSet)) {
      const association = this.getSection(networkInterface, 'association');
      const publicIp = this.getText(association, 'publicIp');

      if (publicIp) {
        return publicIp;
      }

      const privateIpAddressesSet = this.getSection(
        networkInterface,
        'privateIpAddressesSet',
      );

      for (const privateIpAddress of this.getTopLevelItems(
        privateIpAddressesSet,
      )) {
        const privateIpAssociation = this.getSection(
          privateIpAddress,
          'association',
        );
        const privateIpPublicIp = this.getText(
          privateIpAssociation,
          'publicIp',
        );

        if (privateIpPublicIp) {
          return privateIpPublicIp;
        }
      }
    }

    return null;
  }

  private getPublicIpv4(instanceXml: string): string | null {
    return (
      this.getText(instanceXml, 'ipAddress') ?? this.getElasticIp(instanceXml)
    );
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
