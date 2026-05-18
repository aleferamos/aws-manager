import { IsNotEmpty, IsObject } from 'class-validator';

export class UpdateAppConfigurationDto {
  @IsObject()
  @IsNotEmpty()
  jsonConfig: Record<string, unknown>;
}
