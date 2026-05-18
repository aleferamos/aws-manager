import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface ListS3BucketsQueryDto {
  credentialId: string;
  region: string;
}

export interface S3BucketItem {
  name: string;
  creationDate: string | null;
  region: string | null;
}

export interface ListS3BucketsResponse {
  credentialId: string;
  region: string;
  items: S3BucketItem[];
}

export interface CreateS3BucketDto extends ListS3BucketsQueryDto {
  bucketName: string;
  bucketType: 'general-purpose' | 'directory';
  availabilityZoneId?: string;
  acknowledgeSingleAvailabilityZone?: boolean;
}

export interface S3ObjectItem {
  key: string;
  type: 'file' | 'folder';
  lastModified: string | null;
  size: number;
  eTag: string | null;
  storageClass: string | null;
}

export interface ListS3ObjectsQueryDto extends ListS3BucketsQueryDto {
  prefix?: string;
  continuationToken?: string;
  maxKeys?: number;
}

export interface ListS3ObjectsResponse {
  credentialId: string;
  region: string;
  bucketName: string;
  prefix: string;
  items: S3ObjectItem[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class S3Service {
  private httpClient = inject(HttpClient);
  private urlS3 = `${environment.apiUrl}/s3`;

  listBuckets(query: ListS3BucketsQueryDto) {
    return this.httpClient.get<ListS3BucketsResponse>(`${this.urlS3}/buckets`, {
      params: this.toParams(query),
      withCredentials: true,
    });
  }

  createBucket(payload: CreateS3BucketDto) {
    return this.httpClient.post(`${this.urlS3}/buckets`, payload, {
      withCredentials: true,
    });
  }

  emptyBucket(bucketName: string, query: ListS3BucketsQueryDto) {
    return this.httpClient.post(
      `${this.urlS3}/buckets/${encodeURIComponent(bucketName)}/empty`,
      null,
      {
        params: this.toParams(query),
        withCredentials: true,
      },
    );
  }

  deleteBucket(bucketName: string, query: ListS3BucketsQueryDto) {
    return this.httpClient.delete(
      `${this.urlS3}/buckets/${encodeURIComponent(bucketName)}`,
      {
        params: this.toParams(query),
        withCredentials: true,
      },
    );
  }

  listObjects(bucketName: string, query: ListS3ObjectsQueryDto) {
    let params = this.toParams(query);

    if (query.prefix) {
      params = params.set('prefix', query.prefix);
    }

    if (query.continuationToken) {
      params = params.set('continuationToken', query.continuationToken);
    }

    if (query.maxKeys) {
      params = params.set('maxKeys', query.maxKeys);
    }

    return this.httpClient.get<ListS3ObjectsResponse>(
      `${this.urlS3}/buckets/${encodeURIComponent(bucketName)}/objects`,
      {
        params,
        withCredentials: true,
      },
    );
  }

  uploadObject(bucketName: string, query: ListS3BucketsQueryDto, key: string, file: File) {
    const formData = new FormData();

    formData.append('credentialId', query.credentialId);
    formData.append('region', query.region);
    formData.append('key', key);
    formData.append('file', file);

    return this.httpClient.post(
      `${this.urlS3}/buckets/${encodeURIComponent(bucketName)}/objects`,
      formData,
      {
        withCredentials: true,
      },
    );
  }

  deleteObjects(bucketName: string, query: ListS3BucketsQueryDto, keys: string[]) {
    return this.httpClient.delete(
      `${this.urlS3}/buckets/${encodeURIComponent(bucketName)}/objects`,
      {
        body: {
          credentialId: query.credentialId,
          region: query.region,
          keys,
        },
        withCredentials: true,
      },
    );
  }

  downloadObjects(bucketName: string, query: ListS3BucketsQueryDto, keys: string[]) {
    return this.httpClient.post(
      `${this.urlS3}/buckets/${encodeURIComponent(bucketName)}/objects/download`,
      {
        credentialId: query.credentialId,
        region: query.region,
        keys,
      },
      {
        observe: 'response',
        responseType: 'blob',
        withCredentials: true,
      },
    );
  }

  renameObject(
    bucketName: string,
    query: ListS3BucketsQueryDto,
    oldKey: string,
    newKey: string,
  ) {
    return this.httpClient.patch(
      `${this.urlS3}/buckets/${encodeURIComponent(bucketName)}/objects/rename`,
      {
        credentialId: query.credentialId,
        region: query.region,
        oldKey,
        newKey,
      },
      {
        withCredentials: true,
      },
    );
  }

  private toParams(query: ListS3BucketsQueryDto): HttpParams {
    return new HttpParams()
      .set('credentialId', query.credentialId)
      .set('region', query.region);
  }
}
