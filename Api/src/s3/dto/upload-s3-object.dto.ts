import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { ListS3QueryDto } from './list-s3-query.dto';

export class UploadS3ObjectDto extends ListS3QueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024, {
    context: {
      max: 1024,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  key: string;
}
