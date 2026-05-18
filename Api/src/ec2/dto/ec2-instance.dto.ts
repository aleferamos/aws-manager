export class Ec2InstanceDto {
  name: string | null;
  instanceId: string;
  instanceState: string | null;
  instanceType: string | null;
  statusCheck: string | null;
  availabilityZone: string | null;
  publicIpv4: string | null;
  elasticIp: string | null;
  platform: string | null;
}

export class Ec2InstanceListDto {
  credentialId: string;
  region: string;
  items: Ec2InstanceDto[];
}

export class Ec2SecurityGroupDto {
  groupId: string;
  groupName: string | null;
}

export class Ec2ElasticIpDto {
  publicIp: string;
  name: string | null;
  allocationId: string | null;
  associationId: string | null;
}

export class Ec2InstanceDetailDto {
  credentialId: string;
  region: string;
  name: string | null;
  instanceId: string;
  imageId: string | null;
  imageName: string | null;
  publicIpv4Address: string | null;
  privateIpv4Addresses: string[];
  ipv6Addresses: string[];
  publicDns: string | null;
  privateDnsName: string | null;
  instanceState: string | null;
  instanceType: string | null;
  vpcId: string | null;
  subnetId: string | null;
  instanceArn: string | null;
  platform: string | null;
  availabilityZone: string | null;
  launchTime: string | null;
  ownerId: string | null;
  keyName: string | null;
  iamRole: string | null;
  iamInstanceProfileArn: string | null;
  sshUsername: string | null;
  sshCommand: string | null;
  sshKeyPermissionCommand: string | null;
  sshPortOpen: boolean | null;
  hostnameType: string | null;
  privateResourceDnsNameAnswer: string | null;
  autoAssignedIpAddress: string | null;
  imdsv2: string | null;
  operator: string | null;
  autoScalingGroupName: string | null;
  managed: boolean;
  elasticIpAddresses: Ec2ElasticIpDto[];
  securityGroups: Ec2SecurityGroupDto[];
}
