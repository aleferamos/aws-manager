import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

import { ListS3QueryDto } from './list-s3-query.dto';

export class DownloadS3ObjectsDto extends ListS3QueryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  keys: string[];
}
