import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class UpdateUserViewPersonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150, {
    context: {
      max: 150,
    },
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(30, {
    context: {
      max: 30,
    },
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalizedValue = value.trim();

    return normalizedValue || null;
  })
  phone?: string | null;
}

export class UpdateUserViewDto {
  @IsBoolean()
  active: boolean;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserViewPersonDto)
  person: UpdateUserViewPersonDto;
}
