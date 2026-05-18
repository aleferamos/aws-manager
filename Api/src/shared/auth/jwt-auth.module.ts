import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CookieAuthGuard } from './cookie-auth.guard';
import { JWT_EXPIRES_IN, JWT_SECRET } from './jwt-auth.constants';
import { RootAuthGuard } from './root-auth.guard';
import { User } from '../../user/entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        expiresIn: JWT_EXPIRES_IN,
      },
    }),
  ],
  providers: [CookieAuthGuard, RootAuthGuard],
  exports: [CookieAuthGuard, RootAuthGuard, JwtModule],
})
export class JwtAuthModule {}
