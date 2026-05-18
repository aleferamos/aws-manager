import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';

import { RootAuthGuard } from '../shared/auth/root-auth.guard';
import { ConfigurationService } from './configuration.service';
import { UpdateAppConfigurationDto } from './dto/update-app-configuration.dto';

@Controller('configuration')
@UseGuards(RootAuthGuard)
export class ConfigurationController {
  constructor(private readonly service: ConfigurationService) {}

  @Get()
  async get() {
    return this.service.get();
  }

  @Put()
  async update(@Body() dto: UpdateAppConfigurationDto) {
    return this.service.update(dto);
  }
}
