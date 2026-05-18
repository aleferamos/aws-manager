import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type BillingGranularity = 'DAILY' | 'MONTHLY';
export type BillingGroupBy =
  | 'SERVICE'
  | 'LINKED_ACCOUNT'
  | 'REGION'
  | 'USAGE_TYPE';

export class BillingCostQueryDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  credentialId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50, {
    context: {
      max: 50,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  region: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsIn(['DAILY', 'MONTHLY'])
  @IsOptional()
  granularity?: BillingGranularity = 'MONTHLY';

  @IsIn(['SERVICE', 'LINKED_ACCOUNT', 'REGION', 'USAGE_TYPE'])
  @IsOptional()
  groupBy?: BillingGroupBy = 'SERVICE';
}
