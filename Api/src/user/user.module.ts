import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { EmailService } from '../shared/email/email.service';
import { ConfigurationModule } from '../configuration/configuration.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Person]), ConfigurationModule],
  controllers: [UserController],
  providers: [UserService, EmailService],
  exports: [UserService],
})
export class UserModule {}
