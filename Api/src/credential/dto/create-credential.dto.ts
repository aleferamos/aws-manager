import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCredentialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120, {
    context: {
      max: 120,
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

  @IsString()
  @IsNotEmpty()
  @MaxLength(255, {
    context: {
      max: 255,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  accessKeyId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255, {
    context: {
      max: 255,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  secretKeyId: string;
}
