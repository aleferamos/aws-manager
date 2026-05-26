import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ListCloudFrontQueryDto } from './list-cloud-front-query.dto';

export class CreateCloudFrontInvalidationDto extends ListCloudFrontQueryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((item) => (typeof item === 'string' ? item.trim() : item));
    }

    return value;
  })
  paths: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128, {
    context: {
      max: 128,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  callerReference?: string;
}
