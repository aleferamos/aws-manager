import { Module } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from './entities/credential.entity';
import { CredentialEncryptionService } from './credential-encryption.service';
import { UserCredential } from './entities/user-credential.entity';
import { UserCredentialAuthority } from './entities/user-credential-authority.entity';
import { Authority } from '../authority/entities/authority.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Credential,
      UserCredential,
      UserCredentialAuthority,
      Authority,
      User,
    ]),
  ],
  controllers: [CredentialController],
  providers: [CredentialService, CredentialEncryptionService],
})
export class CredentialModule {}
