export class SecurityGroupDto {
  name: string | null;
  groupId: string;
  groupName: string | null;
  description: string | null;
  vpcId: string | null;
  ownerId: string | null;
  inboundRuleCount: number;
  outboundRuleCount: number;
}

export class SecurityGroupListDto {
  credentialId: string;
  region: string;
  items: SecurityGroupDto[];
}

export class SecurityGroupRuleDto {
  name: string | null;
  securityGroupRuleId: string;
  ipVersion: string | null;
  type: string;
  protocol: string;
  portRange: string;
  source: string | null;
  destination: string | null;
  description: string | null;
}

export class SecurityGroupTagDto {
  key: string;
  value: string | null;
}

export class SecurityGroupDetailDto {
  credentialId: string;
  region: string;
  securityGroup: SecurityGroupDto;
  inboundRules: SecurityGroupRuleDto[];
  outboundRules: SecurityGroupRuleDto[];
  tags: SecurityGroupTagDto[];
}
