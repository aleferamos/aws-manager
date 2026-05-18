import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { AuthorityScope } from '../entities/authority.entity';

export class CreateAuthorityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, {
    context: {
      max: 100,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100, {
    context: {
      max: 100,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, {
    context: {
      max: 255,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsIn(['SYSTEM', 'CREDENTIAL'])
  scope: AuthorityScope;
}
