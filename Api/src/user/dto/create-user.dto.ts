import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
