import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface ListCloudFrontQueryDto {
  credentialId: string;
}

export interface CloudFrontDistributionItem {
  id: string;
  arn: string | null;
  status: string | null;
  domainName: string | null;
  enabled: boolean;
  comment: string | null;
  priceClass: string | null;
  httpVersion: string | null;
  ipv6Enabled: boolean;
  lastModifiedTime: string | null;
  aliases: string[];
  origins: string[];
}

export interface ListCloudFrontDistributionsResponse {
  credentialId: string;
  items: CloudFrontDistributionItem[];
}

export interface ViewCloudFrontDistributionResponse {
  credentialId: string;
  distribution: CloudFrontDistributionItem;
}

export interface CloudFrontInvalidationItem {
  id: string;
  status: string | null;
  createTime: string | null;
}

export interface ListCloudFrontInvalidationsResponse {
  credentialId: string;
  distributionId: string;
  items: CloudFrontInvalidationItem[];
}

export interface CreateCloudFrontInvalidationDto extends ListCloudFrontQueryDto {
  paths: string[];
  callerReference?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CloudFrontService {
  private httpClient = inject(HttpClient);
  private urlCloudFront = `${environment.apiUrl}/cloud-front`;

  listDistributions(query: ListCloudFrontQueryDto) {
    return this.httpClient.get<ListCloudFrontDistributionsResponse>(
      `${this.urlCloudFront}/distributions`,
      {
        params: this.toParams(query),
        withCredentials: true,
      },
    );
  }

  viewDistribution(distributionId: string, query: ListCloudFrontQueryDto) {
    return this.httpClient.get<ViewCloudFrontDistributionResponse>(
      `${this.urlCloudFront}/distributions/${encodeURIComponent(distributionId)}`,
      {
        params: this.toParams(query),
        withCredentials: true,
      },
    );
  }

  listInvalidations(distributionId: string, query: ListCloudFrontQueryDto) {
    return this.httpClient.get<ListCloudFrontInvalidationsResponse>(
      `${this.urlCloudFront}/distributions/${encodeURIComponent(distributionId)}/invalidations`,
      {
        headers: {
          'X-Skip-Loading': 'true',
        },
        params: this.toParams(query),
        withCredentials: true,
      },
    );
  }

  createInvalidation(distributionId: string, payload: CreateCloudFrontInvalidationDto) {
    return this.httpClient.post(
      `${this.urlCloudFront}/distributions/${encodeURIComponent(distributionId)}/invalidations`,
      payload,
      {
        withCredentials: true,
      },
    );
  }

  private toParams(query: ListCloudFrontQueryDto): HttpParams {
    return new HttpParams().set('credentialId', query.credentialId);
  }
}
