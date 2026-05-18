import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { ListS3QueryDto } from './list-s3-query.dto';

export class ListS3ObjectsQueryDto extends ListS3QueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  prefix?: string;

  @IsOptional()
  @IsString()
  continuationToken?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  maxKeys?: number;
}
