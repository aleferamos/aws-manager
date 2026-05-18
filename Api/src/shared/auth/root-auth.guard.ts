import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { AuthenticatedRequest, CookieAuthGuard } from './cookie-auth.guard';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class RootAuthGuard implements CanActivate {
  constructor(
    private readonly cookieAuthGuard: CookieAuthGuard,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.cookieAuthGuard.canActivate(context);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authenticatedUserId = request.user?.id;

    if (!authenticatedUserId) {
      return false;
    }

    const user = await this.dataSource.getRepository(User).findOne({
      where: {
        id: authenticatedUserId,
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (user?.type === 'ROOT') {
      return true;
    }

    throw new ForbiddenException({
      code: 'AUTH_ROOT_REQUIRED',
      message: this.i18n.translate('auth.rootRequired'),
    });
  }
}
