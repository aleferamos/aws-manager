import { Module } from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { AuthorityController } from './authority.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Authority } from './entities/authority.entity';
import { UserAuthority } from './entities/user-authority.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Authority,
      UserAuthority,
      UserCredentialAuthority,
    ]),
  ],
  controllers: [AuthorityController],
  providers: [AuthorityService],
})
export class AuthorityModule {}
