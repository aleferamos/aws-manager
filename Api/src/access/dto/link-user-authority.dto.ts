import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LinkUserAuthorityDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  authorityId: string;
}
