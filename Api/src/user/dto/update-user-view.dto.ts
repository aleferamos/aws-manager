import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
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
  @IsNotEmpty()
  @MaxLength(30, {
    context: {
      max: 30,
    },
  })
  phone: string;
}

export class UpdateUserViewDto {
  @IsBoolean()
  active: boolean;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserViewPersonDto)
  person: UpdateUserViewPersonDto;
}
