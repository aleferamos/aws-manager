import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface ListSecurityGroupsQueryDto {
  credentialId: string;
  region: string;
}

export interface SecurityGroupItem {
  name: string;
  groupId: string;
  groupName: string;
  description: string;
  vpcId: string;
  ownerId: string;
  inboundRuleCount: number;
  outboundRuleCount: number;
}

export interface ListSecurityGroupsResponse {
  credentialId: string;
  region: string;
  items: SecurityGroupItem[];
}

export interface SecurityGroupRuleItem {
  name: string | null;
  securityGroupRuleId: string;
  ipVersion: string;
  type: string;
  protocol: string;
  portRange: string;
  source: string | null;
  destination: string | null;
  description: string | null;
}

export interface SecurityGroupTagItem {
  key: string;
  value: string;
}

export interface ViewSecurityGroupResponse {
  credentialId: string;
  region: string;
  securityGroup: SecurityGroupItem;
  inboundRules: SecurityGroupRuleItem[];
  outboundRules: SecurityGroupRuleItem[];
  tags: SecurityGroupTagItem[];
}

export interface CreateSecurityGroupInboundRuleDto {
  credentialId: string;
  region: string;
  type: string;
  protocol?: string;
  fromPort?: number;
  toPort?: number;
  source: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SecurityGroupService {
  private httpClient = inject(HttpClient);
  private urlSecurityGroups = `${environment.apiUrl}/security-groups`;

  list(query: ListSecurityGroupsQueryDto) {
    const params = new HttpParams()
      .set('credentialId', query.credentialId)
      .set('region', query.region);

    return this.httpClient.get<ListSecurityGroupsResponse>(`${this.urlSecurityGroups}/list`, {
      params,
      withCredentials: true,
    });
  }

  view(groupId: string, query: ListSecurityGroupsQueryDto) {
    const params = new HttpParams()
      .set('credentialId', query.credentialId)
      .set('region', query.region);

    return this.httpClient.get<ViewSecurityGroupResponse>(
      `${this.urlSecurityGroups}/view/${encodeURIComponent(groupId)}`,
      {
        params,
        withCredentials: true,
      },
    );
  }

  createInboundRule(groupId: string, payload: CreateSecurityGroupInboundRuleDto) {
    return this.httpClient.post(
      `${this.urlSecurityGroups}/${encodeURIComponent(groupId)}/inbound-rules`,
      payload,
      {
        withCredentials: true,
      },
    );
  }

  deleteInboundRule(groupId: string, ruleId: string, query: ListSecurityGroupsQueryDto) {
    const params = new HttpParams()
      .set('credentialId', query.credentialId)
      .set('region', query.region);

    return this.httpClient.delete(
      `${this.urlSecurityGroups}/${encodeURIComponent(groupId)}/inbound-rules/${encodeURIComponent(ruleId)}`,
      {
        params,
        withCredentials: true,
      },
    );
  }
}
