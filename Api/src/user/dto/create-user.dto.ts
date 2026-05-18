import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150, {
    context: {
      max: 150,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150, {
    context: {
      max: 150,
    },
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30, {
    context: {
      max: 30,
    },
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;
}
