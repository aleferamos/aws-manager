export class S3BucketDto {
  name: string;
  creationDate: string | null;
  region: string | null;
}

export class S3BucketListDto {
  credentialId: string;
  region: string;
  items: S3BucketDto[];
}

export class S3ObjectDto {
  key: string;
  type: 'file' | 'folder';
  lastModified: string | null;
  size: number;
  eTag: string | null;
  storageClass: string | null;
}

export class S3ObjectListDto {
  credentialId: string;
  region: string;
  bucketName: string;
  prefix: string;
  items: S3ObjectDto[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
}
