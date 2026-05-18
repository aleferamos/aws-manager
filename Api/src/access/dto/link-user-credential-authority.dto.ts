import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LinkUserCredentialAuthorityDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  userCredentialId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  authorityId: string;
}
