import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac } from 'node:crypto';
import { Repository } from 'typeorm';

import { CreateS3BucketDto } from './dto/create-s3-bucket.dto';
import { DeleteS3ObjectsDto } from './dto/delete-s3-objects.dto';
import { DownloadS3ObjectsDto } from './dto/download-s3-objects.dto';
import { ListS3ObjectsQueryDto } from './dto/list-s3-objects-query.dto';
import { ListS3QueryDto } from './dto/list-s3-query.dto';
import { RenameS3ObjectDto } from './dto/rename-s3-object.dto';
import {
  S3BucketDto,
  S3BucketListDto,
  S3ObjectDto,
  S3ObjectListDto,
} from './dto/s3-bucket.dto';
import { UploadS3ObjectDto } from './dto/upload-s3-object.dto';
import { Authority } from '../authority/entities/authority.entity';
import { CredentialEncryptionService } from '../credential/credential-encryption.service';
import { Credential } from '../credential/entities/credential.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';
import { UserCredential } from '../credential/entities/user-credential.entity';
import { I18nService } from '../shared/i18n/i18n.service';
import { User } from '../user/entities/user.entity';

const S3_LIST_AUTHORITY_CODE = 'AWS_S3_LIST';
const S3_CREATE_BUCKET_AUTHORITY_CODE = 'AWS_S3_CREATE_BUCKET';
const S3_DELETE_BUCKET_AUTHORITY_CODE = 'AWS_S3_DELETE_BUCKET';
const S3_EMPTY_BUCKET_AUTHORITY_CODE = 'AWS_S3_EMPTY_BUCKET';
const S3_OBJECT_LIST_AUTHORITY_CODE = 'AWS_S3_OBJECT_LIST';
const S3_OBJECT_PUT_AUTHORITY_CODE = 'AWS_S3_OBJECT_PUT';
const S3_OBJECT_DELETE_AUTHORITY_CODE = 'AWS_S3_OBJECT_DELETE';
const S3_OBJECT_DOWNLOAD_AUTHORITY_CODE = 'AWS_S3_OBJECT_DOWNLOAD';
const S3_OBJECT_RENAME_AUTHORITY_CODE = 'AWS_S3_OBJECT_RENAME';
const S3_SERVICE = 's3';
const S3_EXPRESS_CONTROL_SERVICE = 's3express';
const S3_XML_CONTENT_TYPE = 'application/xml';
const S3_LIST_BUCKETS_REGION = 'us-east-1';

type S3Secrets = {
  accessKeyId: string;
  secretAccessKey: string;
};

type S3ObjectIdentifier = {
  key: string;
  versionId?: string;
};

type S3ListVersionsResult = {
  objects: S3ObjectIdentifier[];
  isTruncated: boolean;
  nextKeyMarker: string | null;
  nextVersionIdMarker: string | null;
};

type S3ListObjectsResult = {
  objects: S3ObjectIdentifier[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
};

type S3ListObjectDetailsResult = {
  objects: S3ObjectDto[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
};

type S3RawResponse = {
  body: Buffer;
  contentType: string | null;
};

type S3DownloadResult = {
  filename: string;
  contentType: string;
  body: Buffer;
};

@Injectable()
export class S3Service {
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

  async listBuckets(
    userId: string,
    query: ListS3QueryDto,
  ): Promise<S3BucketListDto> {
    const [user, credential] = await this.getUserAndCredential(
      userId,
      query.credentialId,
    );

    await this.assertCanUseS3Authority({
      user,
      credentialId: credential.id,
      authorityCode: S3_LIST_AUTHORITY_CODE,
      authorityNotConfiguredCode: 'S3_LIST_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'S3_LIST_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey: 's3.listAuthorityNotConfigured',
      authorityRequiredMessageKey: 's3.listAuthorityRequired',
    });

    const secrets = this.getSecrets(credential);
    const bucketsXml = await this.callS3({
      ...secrets,
      region: S3_LIST_BUCKETS_REGION,
      host: 's3.amazonaws.com',
      method: 'GET',
    });
    const buckets = this.parseBuckets(bucketsXml);
    const items = await Promise.all(
      buckets.map(async (bucket) => ({
        ...bucket,
        region: await this.getBucketLocation(secrets, bucket.name),
      })),
    );

    return {
      credentialId: credential.id,
      region: query.region.trim(),
      items,
    };
  }

  async createBucket(
    userId: string,
    createBucketDto: CreateS3BucketDto,
  ): Promise<void> {
    const bucketType = createBucketDto.bucketType ?? 'general-purpose';
    const [user, credential] = await this.getUserAndCredential(
      userId,
      createBucketDto.credentialId,
    );

    await this.assertCanUseS3Authority({
      user,
      credentialId: credential.id,
      authorityCode: S3_CREATE_BUCKET_AUTHORITY_CODE,
      authorityNotConfiguredCode: 'S3_CREATE_BUCKET_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'S3_CREATE_BUCKET_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey: 's3.createBucketAuthorityNotConfigured',
      authorityRequiredMessageKey: 's3.createBucketAuthorityRequired',
    });

    const region = createBucketDto.region.trim();
    const secrets = this.getSecrets(credential);

    if (bucketType === 'directory') {
      await this.createDirectoryBucket(secrets, region, createBucketDto);
      return;
    }

    const bucketName = this.normalizeBucketName(createBucketDto.bucketName);
    const body =
      region === S3_LIST_BUCKETS_REGION
        ? ''
        : [
            '<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
            `<LocationConstraint>${this.escapeXml(region)}</LocationConstraint>`,
            '</CreateBucketConfiguration>',
          ].join('');

    await this.callS3({
      ...secrets,
      region,
      bucket: bucketName,
      method: 'PUT',
      body,
      contentType: body ? S3_XML_CONTENT_TYPE : undefined,
    });
  }

  private async createDirectoryBucket(
    secrets: S3Secrets,
    region: string,
    createBucketDto: CreateS3BucketDto,
  ): Promise<void> {
    if (!createBucketDto.acknowledgeSingleAvailabilityZone) {
      throw new BadRequestException({
        code: 'S3_DIRECTORY_BUCKET_ACKNOWLEDGEMENT_REQUIRED',
        message: this.i18n.translate('s3.directoryBucketAcknowledgementRequired'),
      });
    }

    const availabilityZoneId = this.normalizeAvailabilityZoneId(
      createBucketDto.availabilityZoneId ?? '',
    );
    const bucketName = this.buildDirectoryBucketName(
      createBucketDto.bucketName,
      availabilityZoneId,
    );
    const body = [
      '<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      '<Location>',
      '<Type>AvailabilityZone</Type>',
      `<Name>${this.escapeXml(availabilityZoneId)}</Name>`,
      '</Location>',
      '<Bucket>',
      '<DataRedundancy>SingleAvailabilityZone</DataRedundancy>',
      '<Type>Directory</Type>',
      '</Bucket>',
      '</CreateBucketConfiguration>',
    ].join('');

    await this.callS3({
      ...secrets,
      region,
      host: `s3express-control.${region}.amazonaws.com`,
      bucket: bucketName,
      method: 'PUT',
      body,
      contentType: S3_XML_CONTENT_TYPE,
      pathStyle: true,
      signingService: S3_EXPRESS_CONTROL_SERVICE,
    });
  }

  async emptyBucket(
    userId: string,
    bucketName: string,
    query: ListS3QueryDto,
  ): Promise<number> {
    const normalizedBucketName = this.normalizeBucketName(bucketName);
    const [user, credential] = await this.getUserAndCredential(
      userId,
      query.credentialId,
    );

    await this.assertCanUseS3Authority({
      user,
      credentialId: credential.id,
      authorityCode: S3_EMPTY_BUCKET_AUTHORITY_CODE,
      authorityNotConfiguredCode: 'S3_EMPTY_BUCKET_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'S3_EMPTY_BUCKET_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey: 's3.emptyBucketAuthorityNotConfigured',
      authorityRequiredMessageKey: 's3.emptyBucketAuthorityRequired',
    });

    const secrets = this.getSecrets(credential);
    const region = query.region.trim();
    let deletedObjects = 0;

    deletedObjects += await this.deleteAllVersions(
      secrets,
      region,
      normalizedBucketName,
    );
    deletedObjects += await this.deleteCurrentObjects(
      secrets,
      region,
      normalizedBucketName,
    );

    return deletedObjects;
  }

  async deleteBucket(
    userId: string,
    bucketName: string,
    query: ListS3QueryDto,
  ): Promise<void> {
    const normalizedBucketName = this.normalizeBucketName(bucketName);
    const [user, credential] = await this.getUserAndCredential(
      userId,
      query.credentialId,
    );

    await this.assertCanUseS3Authority({
      user,
      credentialId: credential.id,
      authorityCode: S3_DELETE_BUCKET_AUTHORITY_CODE,
      authorityNotConfiguredCode: 'S3_DELETE_BUCKET_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'S3_DELETE_BUCKET_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey: 's3.deleteBucketAuthorityNotConfigured',
      authorityRequiredMessageKey: 's3.deleteBucketAuthorityRequired',
    });

    await this.callS3({
      ...this.getSecrets(credential),
      region: query.region.trim(),
      bucket: normalizedBucketName,
      method: 'DELETE',
    });
  }

  async listBucketObjects(
    userId: string,
    bucketName: string,
    query: ListS3ObjectsQueryDto,
  ): Promise<S3ObjectListDto> {
    const normalizedBucketName = this.normalizeAnyBucketName(bucketName);
    const [user, credential] = await this.getUserAndCredential(
      userId,
      query.credentialId,
    );

    await this.assertCanUseS3Authority({
      user,
      credentialId: credential.id,
      authorityCode: S3_OBJECT_LIST_AUTHORITY_CODE,
      authorityNotConfiguredCode: 'S3_OBJECT_LIST_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'S3_OBJECT_LIST_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey: 's3.objectListAuthorityNotConfigured',
      authorityRequiredMessageKey: 's3.objectListAuthorityRequired',
    });

    const result = await this.listObjectDetails({
      secrets: this.getSecrets(credential),
      region: query.region.trim(),
      bucket: normalizedBucketName,
      prefix: query.prefix?.trim() ?? '',
      continuationToken: query.continuationToken ?? null,
      maxKeys: query.maxKeys ?? 1000,
    });

    return {
      credentialId: credential.id,
      region: query.region.trim(),
      bucketName: normalizedBucketName,
      prefix: query.prefix?.trim() ?? '',
      items: result.objects,
      isTruncated: result.isTruncated,
      nextContinuationToken: result.nextContinuationToken,
    };
  }

  async uploadObject(
    userId: string,
    bucketName: string,
    uploadObjectDto: UploadS3ObjectDto,
    file: any,
  ): Promise<void> {
    const normalizedBucketName = this.normalizeAnyBucketName(bucketName);
    const key = this.normalizeObjectKey(uploadObjectDto.key);

    if (!file?.buffer) {
      throw new BadRequestException({
        code: 'S3_OBJECT_FILE_REQUIRED',
        message: this.i18n.translate('s3.objectFileRequired'),
      });
    }

    const [user, credential] = await this.getUserAndCredential(
      userId,
      uploadObjectDto.credentialId,
    );

    await this.assertCanUseS3Authority({
      user,
      credentialId: credential.id,
      authorityCode: S3_OBJECT_PUT_AUTHORITY_CODE,
      authorityNotConfiguredCode: 'S3_OBJECT_PUT_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'S3_OBJECT_PUT_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey: 's3.objectPutAuthorityNotConfigured',
      authorityRequiredMessageKey: 's3.objectPutAuthorityRequired',
    });

    await this.callS3({
      ...this.getSecrets(credential),
      region: uploadObjectDto.region.trim(),
      bucket: normalizedBucketName,
      objectKey: key,
      method: 'PUT',
      body: file.buffer,
      contentType: file.mimetype || 'application/octet-stream',
    });
  }

  async deleteSelectedObjects(
    userId: string,
    bucketName: string,
    deleteObjectsDto: DeleteS3ObjectsDto,
  ): Promise<number> {
    const normalizedBucketName = this.normalizeAnyBucketName(bucketName);
    const keys = deleteObjectsDto.keys.map((key) => this.normalizeObjectKey(key));
    const [user, credential] = await this.getUserAndCredential(
      userId,
      deleteObjectsDto.credentialId,
    );

    await this.assertCanUseS3Authority({
      user,
      credentialId: credential.id,
      authorityCode: S3_OBJECT_DELETE_AUTHORITY_CODE,
      authorityNotConfiguredCode: 'S3_OBJECT_DELETE_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'S3_OBJECT_DELETE_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey: 's3.objectDeleteAuthorityNotConfigured',
      authorityRequiredMessageKey: 's3.objectDeleteAuthorityRequired',
    });

    const secrets = this.getSecrets(credential);
    const region = deleteObjectsDto.region.trim();
    const objects = await this.expandObjectKeysForDelete(
      secrets,
      region,
      normalizedBucketName,
      keys,
    );

    return this.deleteObjects(secrets, region, normalizedBucketName, objects);
  }

  async downloadSelectedObjects(
    userId: string,
    bucketName: string,
    downloadObjectsDto: DownloadS3ObjectsDto,
  ): Promise<S3DownloadResult> {
    const normalizedBucketName = this.normalizeAnyBucketName(bucketName);
    const keys = downloadObjectsDto.keys.map((key) => this.normalizeObjectKey(key));
    const [user, credential] = await this.getUserAndCredential(
      userId,
      downloadObjectsDto.credentialId,
    );

    await this.assertCanUseS3Authority({
      user,
      credentialId: credential.id,
      authorityCode: S3_OBJECT_DOWNLOAD_AUTHORITY_CODE,
      authorityNotConfiguredCode: 'S3_OBJECT_DOWNLOAD_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'S3_OBJECT_DOWNLOAD_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey: 's3.objectDownloadAuthorityNotConfigured',
      authorityRequiredMessageKey: 's3.objectDownloadAuthorityRequired',
    });

    const secrets = this.getSecrets(credential);
    const region = downloadObjectsDto.region.trim();
    const objects = await this.expandObjectKeysForDelete(
      secrets,
      region,
      normalizedBucketName,
      keys,
    );
    const files = objects.filter((object) => !object.key.endsWith('/'));

    if (!files.length) {
      throw new BadRequestException({
        code: 'S3_NO_OBJECTS_TO_DOWNLOAD',
        message: this.i18n.translate('s3.noObjectsToDownload'),
      });
    }

    if (files.length === 1 && keys.length === 1 && !keys[0].endsWith('/')) {
      const response = await this.getObject(
        secrets,
        region,
        normalizedBucketName,
        files[0].key,
      );

      return {
        filename: this.getObjectFilename(files[0].key),
        contentType: response.contentType ?? 'application/octet-stream',
        body: response.body,
      };
    }

    const entries = await Promise.all(
      files.map(async (object) => {
        const response = await this.getObject(
          secrets,
          region,
          normalizedBucketName,
          object.key,
        );

        return {
          name: object.key,
          body: response.body,
        };
      }),
    );

    return {
      filename: `${this.sanitizeDownloadName(normalizedBucketName)}-objects.zip`,
      contentType: 'application/zip',
      body: this.createZip(entries),
    };
  }

  async renameObject(
    userId: string,
    bucketName: string,
    renameObjectDto: RenameS3ObjectDto,
  ): Promise<number> {
    const normalizedBucketName = this.normalizeAnyBucketName(bucketName);
    const oldKey = this.normalizeObjectKey(renameObjectDto.oldKey);
    let newKey = this.normalizeObjectKey(renameObjectDto.newKey);
    const isFolder = oldKey.endsWith('/');

    if (isFolder && !newKey.endsWith('/')) {
      newKey = `${newKey}/`;
    }

    if (oldKey === newKey) {
      return 0;
    }

    const [user, credential] = await this.getUserAndCredential(
      userId,
      renameObjectDto.credentialId,
    );

    await this.assertCanUseS3Authority({
      user,
      credentialId: credential.id,
      authorityCode: S3_OBJECT_RENAME_AUTHORITY_CODE,
      authorityNotConfiguredCode: 'S3_OBJECT_RENAME_AUTHORITY_NOT_CONFIGURED',
      authorityRequiredCode: 'S3_OBJECT_RENAME_AUTHORITY_REQUIRED',
      authorityNotConfiguredMessageKey: 's3.objectRenameAuthorityNotConfigured',
      authorityRequiredMessageKey: 's3.objectRenameAuthorityRequired',
    });

    const secrets = this.getSecrets(credential);
    const region = renameObjectDto.region.trim();
    const sourceObjects = isFolder
      ? await this.expandObjectKeysForDelete(
          secrets,
          region,
          normalizedBucketName,
          [oldKey],
        )
      : [{ key: oldKey }];
    const objectsToCopy = isFolder
      ? sourceObjects.filter((object) => object.key !== oldKey)
      : sourceObjects;

    for (const object of objectsToCopy) {
      const targetKey = isFolder
        ? `${newKey}${object.key.slice(oldKey.length)}`
        : newKey;

      await this.copyObject(
        secrets,
        region,
        normalizedBucketName,
        object.key,
        targetKey,
      );
    }

    await this.deleteObjects(secrets, region, normalizedBucketName, sourceObjects);

    return objectsToCopy.length;
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
        code: 'S3_CREDENTIAL_INACTIVE',
        message: this.i18n.translate('s3.credentialInactive'),
      });
    }

    return [user, credential];
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

  private async assertCanUseS3Authority(options: {
    user: User;
    credentialId: string;
    authorityCode: string;
    authorityNotConfiguredCode: string;
    authorityRequiredCode: string;
    authorityNotConfiguredMessageKey:
      | 's3.listAuthorityNotConfigured'
      | 's3.createBucketAuthorityNotConfigured'
      | 's3.deleteBucketAuthorityNotConfigured'
      | 's3.emptyBucketAuthorityNotConfigured'
      | 's3.objectListAuthorityNotConfigured'
      | 's3.objectPutAuthorityNotConfigured'
      | 's3.objectDeleteAuthorityNotConfigured'
      | 's3.objectDownloadAuthorityNotConfigured'
      | 's3.objectRenameAuthorityNotConfigured';
    authorityRequiredMessageKey:
      | 's3.listAuthorityRequired'
      | 's3.createBucketAuthorityRequired'
      | 's3.deleteBucketAuthorityRequired'
      | 's3.emptyBucketAuthorityRequired'
      | 's3.objectListAuthorityRequired'
      | 's3.objectPutAuthorityRequired'
      | 's3.objectDeleteAuthorityRequired'
      | 's3.objectDownloadAuthorityRequired'
      | 's3.objectRenameAuthorityRequired';
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
        code: 'S3_CREDENTIAL_ACCESS_REQUIRED',
        message: this.i18n.translate('s3.credentialAccessRequired'),
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

  private getSecrets(credential: Credential): S3Secrets {
    const secrets = this.credentialEncryptionService.decrypt(
      credential.encryptedFile,
    );

    return {
      accessKeyId: secrets.accessKeyId,
      secretAccessKey: secrets.secretKeyId,
    };
  }

  private async getBucketLocation(
    secrets: S3Secrets,
    bucket: string,
  ): Promise<string | null> {
    try {
      const xml = await this.callS3({
        ...secrets,
        region: S3_LIST_BUCKETS_REGION,
        bucket,
        method: 'GET',
        query: {
          location: '',
        },
      });
      const location = this.getText(xml, 'LocationConstraint');

      return location || S3_LIST_BUCKETS_REGION;
    } catch {
      return null;
    }
  }

  private async deleteAllVersions(
    secrets: S3Secrets,
    region: string,
    bucket: string,
  ): Promise<number> {
    let deletedObjects = 0;
    let keyMarker: string | null = null;
    let versionIdMarker: string | null = null;

    do {
      const result = await this.listObjectVersions(
        secrets,
        region,
        bucket,
        keyMarker,
        versionIdMarker,
      );

      deletedObjects += await this.deleteObjects(
        secrets,
        region,
        bucket,
        result.objects,
      );
      keyMarker = result.nextKeyMarker;
      versionIdMarker = result.nextVersionIdMarker;

      if (!result.isTruncated) {
        break;
      }
    } while (keyMarker);

    return deletedObjects;
  }

  private async deleteCurrentObjects(
    secrets: S3Secrets,
    region: string,
    bucket: string,
  ): Promise<number> {
    let deletedObjects = 0;
    let continuationToken: string | null = null;

    do {
      const result = await this.listObjects(
        secrets,
        region,
        bucket,
        continuationToken,
        '',
      );

      deletedObjects += await this.deleteObjects(
        secrets,
        region,
        bucket,
        result.objects,
      );
      continuationToken = result.nextContinuationToken;

      if (!result.isTruncated) {
        break;
      }
    } while (continuationToken);

    return deletedObjects;
  }

  private async listObjectVersions(
    secrets: S3Secrets,
    region: string,
    bucket: string,
    keyMarker: string | null,
    versionIdMarker: string | null,
  ): Promise<S3ListVersionsResult> {
    const xml = await this.callS3({
      ...secrets,
      region,
      bucket,
      method: 'GET',
      query: {
        versions: '',
        ...(keyMarker ? { 'key-marker': keyMarker } : {}),
        ...(versionIdMarker ? { 'version-id-marker': versionIdMarker } : {}),
      },
    });
    const versions = [
      ...this.parseObjectVersions(xml, 'Version'),
      ...this.parseObjectVersions(xml, 'DeleteMarker'),
    ];

    return {
      objects: versions,
      isTruncated: this.getText(xml, 'IsTruncated') === 'true',
      nextKeyMarker: this.getText(xml, 'NextKeyMarker'),
      nextVersionIdMarker: this.getText(xml, 'NextVersionIdMarker'),
    };
  }

  private async listObjects(
    secrets: S3Secrets,
    region: string,
    bucket: string,
    continuationToken: string | null,
    prefix = '',
  ): Promise<S3ListObjectsResult> {
    const xml = await this.callS3({
      ...secrets,
      region,
      bucket,
      method: 'GET',
      query: {
        'list-type': '2',
        ...(prefix ? { prefix } : {}),
        ...(continuationToken
          ? { 'continuation-token': continuationToken }
          : {}),
      },
    });

    return {
      objects: this.parseCurrentObjects(xml),
      isTruncated: this.getText(xml, 'IsTruncated') === 'true',
      nextContinuationToken: this.getText(xml, 'NextContinuationToken'),
    };
  }

  private async expandObjectKeysForDelete(
    secrets: S3Secrets,
    region: string,
    bucket: string,
    keys: string[],
  ): Promise<S3ObjectIdentifier[]> {
    const objectsByKey = new Map<string, S3ObjectIdentifier>();

    for (const key of keys) {
      objectsByKey.set(key, { key });

      if (!key.endsWith('/')) {
        continue;
      }

      let continuationToken: string | null = null;

      do {
        const result = await this.listObjects(
          secrets,
          region,
          bucket,
          continuationToken,
          key,
        );

        result.objects.forEach((object) => {
          objectsByKey.set(object.key, object);
        });
        continuationToken = result.nextContinuationToken;

        if (!result.isTruncated) {
          break;
        }
      } while (continuationToken);
    }

    return [...objectsByKey.values()];
  }

  private async getObject(
    secrets: S3Secrets,
    region: string,
    bucket: string,
    key: string,
  ): Promise<S3RawResponse> {
    return this.callS3Raw({
      ...secrets,
      region,
      bucket,
      objectKey: key,
      method: 'GET',
    });
  }

  private async copyObject(
    secrets: S3Secrets,
    region: string,
    bucket: string,
    sourceKey: string,
    targetKey: string,
  ): Promise<void> {
    await this.callS3({
      ...secrets,
      region,
      bucket,
      objectKey: targetKey,
      method: 'PUT',
      extraHeaders: {
        'x-amz-copy-source': `/${this.encodeRfc3986(bucket)}/${this.encodeS3Key(sourceKey)}`,
      },
    });
  }

  private async listObjectDetails(options: {
    secrets: S3Secrets;
    region: string;
    bucket: string;
    prefix: string;
    continuationToken: string | null;
    maxKeys: number;
  }): Promise<S3ListObjectDetailsResult> {
    const xml = await this.callS3({
      ...options.secrets,
      region: options.region,
      bucket: options.bucket,
      method: 'GET',
      query: {
        'list-type': '2',
        delimiter: '/',
        'max-keys': String(options.maxKeys),
        ...(options.prefix ? { prefix: options.prefix } : {}),
        ...(options.continuationToken
          ? { 'continuation-token': options.continuationToken }
          : {}),
      },
    });

    return {
      objects: this.parseObjectDetails(xml),
      isTruncated: this.getText(xml, 'IsTruncated') === 'true',
      nextContinuationToken: this.getText(xml, 'NextContinuationToken'),
    };
  }

  private async deleteObjects(
    secrets: S3Secrets,
    region: string,
    bucket: string,
    objects: S3ObjectIdentifier[],
  ): Promise<number> {
    if (!objects.length) {
      return 0;
    }

    let deletedObjects = 0;

    for (const chunk of this.chunk(objects, 1000)) {
      const body = this.buildDeleteObjectsBody(chunk);

      await this.callS3({
        ...secrets,
        region,
        bucket,
        method: 'POST',
        query: {
          delete: '',
        },
        body,
        contentType: S3_XML_CONTENT_TYPE,
        contentMd5: createHash('md5').update(body, 'utf8').digest('base64'),
      });
      deletedObjects += chunk.length;
    }

    return deletedObjects;
  }

  private async callS3(options: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    method: 'GET' | 'PUT' | 'POST' | 'DELETE';
    host?: string;
    bucket?: string;
    objectKey?: string;
    query?: Record<string, string>;
    body?: string | Buffer;
    contentType?: string;
    contentMd5?: string;
    extraHeaders?: Record<string, string>;
    pathStyle?: boolean;
    signingService?: string;
  }): Promise<string> {
    const response = await this.callS3Raw(options);

    return response.body.toString('utf8');
  }

  private async callS3Raw(options: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    method: 'GET' | 'PUT' | 'POST' | 'DELETE';
    host?: string;
    bucket?: string;
    objectKey?: string;
    query?: Record<string, string>;
    body?: string | Buffer;
    contentType?: string;
    contentMd5?: string;
    extraHeaders?: Record<string, string>;
    pathStyle?: boolean;
    signingService?: string;
  }): Promise<S3RawResponse> {
    const body = options.body ?? '';
    const usePathStyle = options.pathStyle || !!options.bucket?.includes('.');
    const host =
      options.host ??
      (usePathStyle
        ? `s3.${options.region}.amazonaws.com`
        : `${options.bucket}.s3.${options.region}.amazonaws.com`);
    const objectPath = options.objectKey
      ? `/${this.encodeS3Key(options.objectKey)}`
      : '';
    const canonicalUri =
      options.bucket && usePathStyle
        ? `/${this.encodeRfc3986(options.bucket)}${objectPath}`
        : objectPath || '/';
    const queryString = this.toCanonicalQueryString(options.query ?? {});
    const endpoint = `https://${host}${canonicalUri}${
      queryString ? `?${queryString}` : ''
    }`;
    const amzDate = this.toAmzDate(new Date());
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = this.sha256(body);
    const headers: Record<string, string> = {
      Host: host,
      'X-Amz-Content-Sha256': payloadHash,
      'X-Amz-Date': amzDate,
    };

    if (options.contentType) {
      headers['Content-Type'] = options.contentType;
    }

    if (options.contentMd5) {
      headers['Content-MD5'] = options.contentMd5;
    }

    Object.entries(options.extraHeaders ?? {}).forEach(([key, value]) => {
      headers[key] = value;
    });

    headers.Authorization = this.createAuthorizationHeader({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      region: options.region,
      method: options.method,
      host,
      canonicalUri,
      amzDate,
      dateStamp,
      queryString,
      payloadHash,
      headers,
      signingService: options.signingService ?? S3_SERVICE,
    });

    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: options.method,
        headers,
        body: (body || undefined) as BodyInit | undefined,
      });
    } catch {
      throw new BadRequestException({
        code: 'S3_AWS_CONNECTION_FAILED',
        message: this.i18n.translate('s3.awsConnectionFailed'),
      });
    }

    const responseBody = Buffer.from(await response.arrayBuffer());

    if (!response.ok) {
      throw new BadRequestException({
        code: 'S3_AWS_REQUEST_FAILED',
        message: this.i18n.translate('s3.awsRequestFailed', {
          status: response.status,
        }),
        awsMessage: this.extractAwsErrorMessage(responseBody.toString('utf8')),
      });
    }

    return {
      body: responseBody,
      contentType: response.headers.get('content-type'),
    };
  }

  private createAuthorizationHeader(options: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    method: string;
    host: string;
    canonicalUri: string;
    amzDate: string;
    dateStamp: string;
    queryString: string;
    payloadHash: string;
    headers: Record<string, string>;
    signingService: string;
  }): string {
    const canonicalHeaders = Object.entries(options.headers)
      .filter(([key]) => key.toLowerCase() !== 'authorization')
      .map(([key, value]) => [
        key.toLowerCase(),
        value.trim().replace(/\s+/g, ' '),
      ])
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}:${value}`);

    const signedHeaders = canonicalHeaders
      .map((header) => header.slice(0, header.indexOf(':')))
      .join(';');
    const canonicalRequest = [
      options.method,
      options.canonicalUri,
      options.queryString,
      canonicalHeaders.join('\n'),
      '',
      signedHeaders,
      options.payloadHash,
    ].join('\n');
    const credentialScope = `${options.dateStamp}/${options.region}/${options.signingService}/aws4_request`;
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
      options.signingService,
    );
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign, 'utf8')
      .digest('hex');

    return `AWS4-HMAC-SHA256 Credential=${options.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private parseBuckets(xml: string): S3BucketDto[] {
    const bucketsSection = this.getSection(xml, 'Buckets');

    return this.getElements(bucketsSection, 'Bucket').flatMap((bucketXml) => {
      const name = this.getText(bucketXml, 'Name');

      if (!name) {
        return [];
      }

      return [
        {
          name,
          creationDate: this.getText(bucketXml, 'CreationDate'),
          region: null,
        },
      ];
    });
  }

  private parseObjectVersions(
    xml: string,
    tagName: 'Version' | 'DeleteMarker',
  ): S3ObjectIdentifier[] {
    return this.getElements(xml, tagName).flatMap((objectXml) => {
      const key = this.getText(objectXml, 'Key');

      if (!key) {
        return [];
      }

      return [
        {
          key,
          versionId: this.getText(objectXml, 'VersionId') ?? undefined,
        },
      ];
    });
  }

  private parseCurrentObjects(xml: string): S3ObjectIdentifier[] {
    return this.getElements(xml, 'Contents').flatMap((objectXml) => {
      const key = this.getText(objectXml, 'Key');

      return key ? [{ key }] : [];
    });
  }

  private parseObjectDetails(xml: string): S3ObjectDto[] {
    const folders = this.getElements(xml, 'CommonPrefixes').flatMap((prefixXml) => {
      const key = this.getText(prefixXml, 'Prefix');

      if (!key) {
        return [];
      }

      return [
        {
          key,
          type: 'folder' as const,
          lastModified: null,
          size: 0,
          eTag: null,
          storageClass: null,
        },
      ];
    });
    const files = this.getElements(xml, 'Contents').flatMap((objectXml) => {
      const key = this.getText(objectXml, 'Key');

      if (!key) {
        return [];
      }

      return [
        {
          key,
          type: 'file' as const,
          lastModified: this.getText(objectXml, 'LastModified'),
          size: Number(this.getText(objectXml, 'Size') ?? 0),
          eTag: this.getText(objectXml, 'ETag')?.replace(/^"|"$/g, '') ?? null,
          storageClass: this.getText(objectXml, 'StorageClass'),
        },
      ];
    });

    return [...folders, ...files];
  }

  private buildDeleteObjectsBody(objects: S3ObjectIdentifier[]): string {
    const objectNodes = objects
      .map((object) => {
        const versionId = object.versionId
          ? `<VersionId>${this.escapeXml(object.versionId)}</VersionId>`
          : '';

        return `<Object><Key>${this.escapeXml(object.key)}</Key>${versionId}</Object>`;
      })
      .join('');

    return `<Delete xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Quiet>true</Quiet>${objectNodes}</Delete>`;
  }

  private normalizeBucketName(value: string): string {
    const bucketName = value.trim().toLowerCase();
    const isValid =
      bucketName.length >= 3 &&
      bucketName.length <= 63 &&
      /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucketName) &&
      !bucketName.includes('..') &&
      !bucketName.includes('.-') &&
      !bucketName.includes('-.') &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(bucketName);

    if (!isValid) {
      throw new BadRequestException({
        code: 'S3_INVALID_BUCKET_NAME',
        message: this.i18n.translate('s3.invalidBucketName'),
      });
    }

    return bucketName;
  }

  private normalizeAnyBucketName(value: string): string {
    const bucketName = value.trim().toLowerCase();

    if (!bucketName) {
      throw new BadRequestException({
        code: 'S3_INVALID_BUCKET_NAME',
        message: this.i18n.translate('s3.invalidBucketName'),
      });
    }

    if (bucketName.endsWith('--x-s3')) {
      return bucketName;
    }

    return this.normalizeBucketName(bucketName);
  }

  private normalizeObjectKey(value: string): string {
    const key = value.trim().replace(/^\/+/, '');

    if (!key) {
      throw new BadRequestException({
        code: 'S3_INVALID_OBJECT_KEY',
        message: this.i18n.translate('s3.invalidObjectKey'),
      });
    }

    return key;
  }

  private normalizeAvailabilityZoneId(value: string): string {
    const availabilityZoneId = value.trim().toLowerCase();

    if (!/^[a-z0-9]+-az\d+$/.test(availabilityZoneId)) {
      throw new BadRequestException({
        code: 'S3_INVALID_AVAILABILITY_ZONE_ID',
        message: this.i18n.translate('s3.invalidAvailabilityZoneId'),
      });
    }

    return availabilityZoneId;
  }

  private buildDirectoryBucketName(
    value: string,
    availabilityZoneId: string,
  ): string {
    const suffix = `--${availabilityZoneId}--x-s3`;
    const bucketName = value.trim().toLowerCase();
    const fullBucketName = bucketName.endsWith(suffix)
      ? bucketName
      : `${bucketName}${suffix}`;
    const baseBucketName = fullBucketName.slice(0, -suffix.length);
    const isValid =
      fullBucketName.length >= 3 &&
      fullBucketName.length <= 63 &&
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(baseBucketName);

    if (!isValid) {
      throw new BadRequestException({
        code: 'S3_INVALID_BUCKET_NAME',
        message: this.i18n.translate('s3.invalidBucketName'),
      });
    }

    return fullBucketName;
  }

  private toCanonicalQueryString(query: Record<string, string>): string {
    return Object.entries(query)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(
        ([key, value]) =>
          `${this.encodeRfc3986(key)}=${this.encodeRfc3986(value)}`,
      )
      .join('&');
  }

  private getSection(xml: string, tagName: string): string {
    const match = new RegExp(
      `<(?:\\w+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${tagName}>`,
    ).exec(xml);

    return match?.[1] ?? '';
  }

  private getText(xml: string, tagName: string): string | null {
    const match = new RegExp(
      `<(?:\\w+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${tagName}>`,
    ).exec(xml);
    const value = match?.[1];

    return value ? this.decodeXml(value) : null;
  }

  private getElements(xml: string, tagName: string): string[] {
    const elements: string[] = [];
    const pattern = new RegExp(
      `<(?:\\w+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${tagName}>`,
      'g',
    );
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(xml))) {
      elements.push(match[1]);
    }

    return elements;
  }

  private extractAwsErrorMessage(responseText: string): string | null {
    const message = this.getText(responseText, 'Message');

    return message ?? (responseText || null);
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }

    return chunks;
  }

  private createZip(entries: { name: string; body: Buffer }[]): Buffer {
    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;
    const { dosDate, dosTime } = this.getZipDateTime(new Date());

    for (const entry of entries) {
      const name = Buffer.from(entry.name.replace(/^\/+/, ''), 'utf8');
      const crc = this.crc32(entry.body);
      const localHeader = Buffer.alloc(30);

      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0x0800, 6);
      localHeader.writeUInt16LE(0, 8);
      localHeader.writeUInt16LE(dosTime, 10);
      localHeader.writeUInt16LE(dosDate, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(entry.body.length, 18);
      localHeader.writeUInt32LE(entry.body.length, 22);
      localHeader.writeUInt16LE(name.length, 26);
      localHeader.writeUInt16LE(0, 28);

      localParts.push(localHeader, name, entry.body);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0x0800, 8);
      centralHeader.writeUInt16LE(0, 10);
      centralHeader.writeUInt16LE(dosTime, 12);
      centralHeader.writeUInt16LE(dosDate, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(entry.body.length, 20);
      centralHeader.writeUInt32LE(entry.body.length, 24);
      centralHeader.writeUInt16LE(name.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(0, 38);
      centralHeader.writeUInt32LE(offset, 42);

      centralParts.push(centralHeader, name);
      offset += localHeader.length + name.length + entry.body.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.alloc(22);

    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(offset, 16);
    end.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralDirectory, end]);
  }

  private getZipDateTime(date: Date): { dosDate: number; dosTime: number } {
    const year = Math.max(date.getFullYear(), 1980);
    const dosTime =
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2);
    const dosDate =
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate();

    return { dosDate, dosTime };
  }

  private crc32(buffer: Buffer): number {
    let crc = 0xffffffff;

    for (const byte of buffer) {
      crc ^= byte;

      for (let bit = 0; bit < 8; bit++) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  private sanitizeDownloadName(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 's3';
  }

  private getObjectFilename(key: string): string {
    const filename = key.split('/').filter(Boolean).pop();

    return this.sanitizeDownloadName(filename || 's3-object');
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
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  private encodeRfc3986(value: string): string {
    return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }

  private encodeS3Key(value: string): string {
    return value.split('/').map((part) => this.encodeRfc3986(part)).join('/');
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

  private sha256(value: string | Buffer): string {
    return typeof value === 'string'
      ? createHash('sha256').update(value, 'utf8').digest('hex')
      : createHash('sha256').update(value).digest('hex');
  }

  private toAmzDate(date: Date): string {
    return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  }
}
