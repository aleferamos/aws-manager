import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { I18nService } from '../i18n/i18n.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    login: string;
  };
}

interface JwtPayload {
  sub: string;
  login: string;
}

@Injectable()
export class CookieAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHENTICATED',
        message: this.i18n.translate('auth.unauthenticated'),
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      request.user = {
        id: payload.sub,
        login: payload.login,
      };

      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_TOKEN',
        message: this.i18n.translate('auth.invalidToken'),
      });
    }
  }
}
