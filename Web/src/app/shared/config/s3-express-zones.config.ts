import { AWS_REGIONS } from './aws-regions.config';

export interface S3ExpressAvailabilityZone {
  id: string;
  regionCode: string;
  regionName: string;
}

const REGION_NAMES = new Map(AWS_REGIONS.map((region) => [region.code, region.name]));

export const S3_EXPRESS_AVAILABILITY_ZONES_BY_REGION: Record<string, string[]> = {
  'us-east-1': ['use1-az4', 'use1-az5', 'use1-az6'],
  'us-east-2': ['use2-az1', 'use2-az2'],
  'us-west-2': ['usw2-az1', 'usw2-az3', 'usw2-az4'],
  'ap-south-1': ['aps1-az1', 'aps1-az3'],
  'ap-northeast-1': ['apne1-az1', 'apne1-az4'],
  'eu-west-1': ['euw1-az1', 'euw1-az3'],
  'eu-north-1': ['eun1-az1', 'eun1-az2', 'eun1-az3'],
};

export function getS3ExpressAvailabilityZones(regionCode: string): S3ExpressAvailabilityZone[] {
  const regionName = REGION_NAMES.get(regionCode) ?? regionCode;

  return (S3_EXPRESS_AVAILABILITY_ZONES_BY_REGION[regionCode] ?? []).map((id) => ({
    id,
    regionCode,
    regionName,
  }));
}
