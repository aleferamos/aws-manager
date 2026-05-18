import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Ec2Controller } from './ec2.controller';
import { Ec2Service } from './ec2.service';
import { Authority } from '../authority/entities/authority.entity';
import { CredentialEncryptionService } from '../credential/credential-encryption.service';
import { Credential } from '../credential/entities/credential.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';
import { UserCredential } from '../credential/entities/user-credential.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Authority,
      Credential,
      User,
      UserCredential,
      UserCredentialAuthority,
    ]),
  ],
  controllers: [Ec2Controller],
  providers: [Ec2Service, CredentialEncryptionService],
})
export class Ec2Module {}
