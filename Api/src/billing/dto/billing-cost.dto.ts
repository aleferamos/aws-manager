export class BillingCostGroupDto {
  key: string;
  amount: number;
  unit: string;
}

export class BillingCostTimeResultDto {
  start: string;
  end: string;
  estimated: boolean;
  totalAmount: number;
  totalUnit: string;
  groups: BillingCostGroupDto[];
}

export class BillingCostAndUsageDto {
  credentialId: string;
  credentialName: string;
  region: string;
  costExplorerRegion: string;
  currency: string;
  totalAmount: number;
  resultsByTime: BillingCostTimeResultDto[];
}
