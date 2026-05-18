import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type UpdateCredentialStatus = 'active' | 'inactive';

export class UpdateCredentialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120, {
    context: {
      max: 120,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsIn(['active', 'inactive'])
  @IsOptional()
  status?: UpdateCredentialStatus;
}
