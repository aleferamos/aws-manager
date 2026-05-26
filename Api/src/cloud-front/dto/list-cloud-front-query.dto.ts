import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ListCloudFrontQueryDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  credentialId: string;
}
