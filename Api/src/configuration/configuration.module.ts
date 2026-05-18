import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { AppConfiguration } from './entities/app-configuration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppConfiguration])],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
