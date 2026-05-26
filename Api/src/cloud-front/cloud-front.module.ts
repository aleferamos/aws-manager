import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CloudFrontController } from './cloud-front.controller';
import { CloudFrontService } from './cloud-front.service';
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
  controllers: [CloudFrontController],
  providers: [CloudFrontService, CredentialEncryptionService],
})
export class CloudFrontModule {}
