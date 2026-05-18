import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { ListS3QueryDto } from './list-s3-query.dto';

export type S3BucketType = 'general-purpose' | 'directory';

export class CreateS3BucketDto extends ListS3QueryDto {
  @IsOptional()
  @IsIn(['general-purpose', 'directory'])
  bucketType?: S3BucketType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(63, {
    context: {
      max: 63,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  bucketName: string;

  @ValidateIf((dto: CreateS3BucketDto) => dto.bucketType === 'directory')
  @IsString()
  @IsNotEmpty()
  @MaxLength(30, {
    context: {
      max: 30,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  availabilityZoneId?: string;

  @ValidateIf((dto: CreateS3BucketDto) => dto.bucketType === 'directory')
  @IsBoolean()
  acknowledgeSingleAvailabilityZone?: boolean;
}
