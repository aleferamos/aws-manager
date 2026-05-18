import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ListS3QueryDto {
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
}
