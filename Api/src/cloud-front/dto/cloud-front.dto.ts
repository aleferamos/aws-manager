export class CloudFrontDistributionDto {
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

export class CloudFrontDistributionListDto {
  credentialId: string;
  items: CloudFrontDistributionDto[];
}

export class CloudFrontInvalidationDto {
  id: string;
  status: string | null;
  createTime: string | null;
}

export class CloudFrontDistributionDetailDto {
  credentialId: string;
  distribution: CloudFrontDistributionDto;
}

export class CloudFrontInvalidationListDto {
  credentialId: string;
  distributionId: string;
  items: CloudFrontInvalidationDto[];
}
