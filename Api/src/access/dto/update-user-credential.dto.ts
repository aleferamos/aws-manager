import { IsBoolean } from 'class-validator';

export class UpdateUserCredentialDto {
  @IsBoolean()
  active: boolean;
}
