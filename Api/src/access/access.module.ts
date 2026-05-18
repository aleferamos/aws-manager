import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { Authority } from '../authority/entities/authority.entity';
import { UserAuthority } from '../authority/entities/user-authority.entity';
import { Credential } from '../credential/entities/credential.entity';
import { UserCredential } from '../credential/entities/user-credential.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Authority,
      Credential,
      User,
      UserAuthority,
      UserCredential,
      UserCredentialAuthority,
    ]),
  ],
  controllers: [AccessController],
  providers: [AccessService],
})
export class AccessModule {}
