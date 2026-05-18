export interface AwsRegion {
  code: string;
  name: string;
  geography: string;
  optInRequired: boolean;
}

export const DEFAULT_AWS_REGION = 'us-east-1';

export const AWS_REGIONS: AwsRegion[] = [
  { code: 'us-east-1', name: 'US East (N. Virginia)', geography: 'United States of America', optInRequired: false },
  { code: 'us-east-2', name: 'US East (Ohio)', geography: 'United States of America', optInRequired: false },
  { code: 'us-west-1', name: 'US West (N. California)', geography: 'United States of America', optInRequired: false },
  { code: 'us-west-2', name: 'US West (Oregon)', geography: 'United States of America', optInRequired: false },
  { code: 'af-south-1', name: 'Africa (Cape Town)', geography: 'South Africa', optInRequired: true },
  { code: 'ap-east-1', name: 'Asia Pacific (Hong Kong)', geography: 'Hong Kong', optInRequired: true },
  { code: 'ap-south-2', name: 'Asia Pacific (Hyderabad)', geography: 'India', optInRequired: true },
  { code: 'ap-southeast-3', name: 'Asia Pacific (Jakarta)', geography: 'Indonesia', optInRequired: true },
  { code: 'ap-southeast-5', name: 'Asia Pacific (Malaysia)', geography: 'Malaysia', optInRequired: true },
  { code: 'ap-southeast-4', name: 'Asia Pacific (Melbourne)', geography: 'Australia', optInRequired: true },
  { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)', geography: 'India', optInRequired: false },
  { code: 'ap-southeast-6', name: 'Asia Pacific (New Zealand)', geography: 'New Zealand', optInRequired: true },
  { code: 'ap-northeast-3', name: 'Asia Pacific (Osaka)', geography: 'Japan', optInRequired: false },
  { code: 'ap-northeast-2', name: 'Asia Pacific (Seoul)', geography: 'South Korea', optInRequired: false },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', geography: 'Singapore', optInRequired: false },
  { code: 'ap-southeast-2', name: 'Asia Pacific (Sydney)', geography: 'Australia', optInRequired: false },
  { code: 'ap-east-2', name: 'Asia Pacific (Taipei)', geography: 'Taiwan', optInRequired: true },
  { code: 'ap-southeast-7', name: 'Asia Pacific (Thailand)', geography: 'Thailand', optInRequired: true },
  { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', geography: 'Japan', optInRequired: false },
  { code: 'ca-central-1', name: 'Canada (Central)', geography: 'Canada', optInRequired: false },
  { code: 'ca-west-1', name: 'Canada West (Calgary)', geography: 'Canada', optInRequired: true },
  { code: 'eu-central-1', name: 'Europe (Frankfurt)', geography: 'Germany', optInRequired: false },
  { code: 'eu-west-1', name: 'Europe (Ireland)', geography: 'Ireland', optInRequired: false },
  { code: 'eu-west-2', name: 'Europe (London)', geography: 'United Kingdom', optInRequired: false },
  { code: 'eu-south-1', name: 'Europe (Milan)', geography: 'Italy', optInRequired: true },
  { code: 'eu-west-3', name: 'Europe (Paris)', geography: 'France', optInRequired: false },
  { code: 'eu-south-2', name: 'Europe (Spain)', geography: 'Spain', optInRequired: true },
  { code: 'eu-north-1', name: 'Europe (Stockholm)', geography: 'Sweden', optInRequired: false },
  { code: 'eu-central-2', name: 'Europe (Zurich)', geography: 'Switzerland', optInRequired: true },
  { code: 'il-central-1', name: 'Israel (Tel Aviv)', geography: 'Israel', optInRequired: true },
  { code: 'mx-central-1', name: 'Mexico (Central)', geography: 'Mexico', optInRequired: true },
  { code: 'me-south-1', name: 'Middle East (Bahrain)', geography: 'Bahrain', optInRequired: true },
  { code: 'me-central-1', name: 'Middle East (UAE)', geography: 'United Arab Emirates', optInRequired: true },
  { code: 'sa-east-1', name: 'South America (Sao Paulo)', geography: 'Brazil', optInRequired: false },
];
