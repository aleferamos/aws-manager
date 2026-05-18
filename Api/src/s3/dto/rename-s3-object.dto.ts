import { IsString, MaxLength } from 'class-validator';

import { ListS3QueryDto } from './list-s3-query.dto';

export class RenameS3ObjectDto extends ListS3QueryDto {
  @IsString()
  @MaxLength(1024)
  oldKey: string;

  @IsString()
  @MaxLength(1024)
  newKey: string;
}
