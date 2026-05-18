import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInboundRuleDto {
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

  @IsString()
  @IsOptional()
  @MaxLength(100, {
    context: {
      max: 100,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, {
    context: {
      max: 20,
    },
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  protocol?: string;

  @IsInt()
  @Min(-1, {
    context: {
      min: -1,
    },
  })
  @Max(65535, {
    context: {
      max: 65535,
    },
  })
  @IsOptional()
  @Type(() => Number)
  fromPort?: number;

  @IsInt()
  @Min(-1, {
    context: {
      min: -1,
    },
  })
  @Max(65535, {
    context: {
      max: 65535,
    },
  })
  @IsOptional()
  @Type(() => Number)
  toPort?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255, {
    context: {
      max: 255,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  source: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, {
    context: {
      max: 255,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
