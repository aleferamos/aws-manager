import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface ListEc2QueryDto {
  credentialId: string;
  region: string;
}

export interface Ec2InstanceItem {
  name: string;
  instanceId: string;
  instanceState: string;
  instanceType: string;
  statusCheck: string;
  availabilityZone: string;
  publicIpv4: string;
  elasticIp: string;
  platform: string;
}

export interface ListEc2Response {
  credentialId: string;
  region: string;
  items: Ec2InstanceItem[];
}

export interface Ec2ElasticIpAddress {
  publicIp: string;
  name: string | null;
  allocationId: string;
  associationId: string;
}

export interface Ec2SecurityGroup {
  groupId: string;
  groupName: string;
}

export interface ViewEc2InstanceResponse {
  credentialId: string;
  region: string;
  name: string;
  instanceId: string;
  imageId: string | null;
  imageName: string | null;
  publicIpv4Address: string | null;
  privateIpv4Addresses: string[];
  ipv6Addresses: string[];
  publicDns: string | null;
  privateDnsName: string | null;
  instanceState: string;
  instanceType: string;
  vpcId: string | null;
  subnetId: string | null;
  instanceArn: string | null;
  launchTime: string | null;
  ownerId: string | null;
  keyName: string | null;
  iamRole: string | null;
  iamInstanceProfileArn: string | null;
  sshUsername: string | null;
  sshCommand: string | null;
  sshKeyPermissionCommand: string | null;
  sshPortOpen: boolean | null;
  imdsv2: string | null;
  managed: boolean;
  elasticIpAddresses: Ec2ElasticIpAddress[];
  securityGroups: Ec2SecurityGroup[];
}

@Injectable({
  providedIn: 'root',
})
export class Ec2Service {
  private httpClient = inject(HttpClient);
  private urlEc2 = `${environment.apiUrl}/ec2`;

  list(query: ListEc2QueryDto) {
    const params = new HttpParams()
      .set('credentialId', query.credentialId)
      .set('region', query.region);

    return this.httpClient.get<ListEc2Response>(`${this.urlEc2}/list`, {
      params,
      withCredentials: true,
    });
  }

  view(instanceId: string, query: ListEc2QueryDto) {
    const params = new HttpParams()
      .set('credentialId', query.credentialId)
      .set('region', query.region);

    return this.httpClient.get<ViewEc2InstanceResponse>(
      `${this.urlEc2}/view/${encodeURIComponent(instanceId)}`,
      {
        params,
        withCredentials: true,
      },
    );
  }
}
