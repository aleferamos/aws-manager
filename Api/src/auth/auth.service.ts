import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../user/dto/login.dto';
import * as bcrypt from 'bcrypt';
import { I18nService } from '../shared/i18n/i18n.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async login(dto: LoginDto): Promise<string> {
    const user = await this.userService.findByLogin(dto.login);

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: this.i18n.translate('auth.invalidCredentials'),
      });
    }

    if (!user.active) {
      throw new ForbiddenException({
        code: 'AUTH_USER_DISABLED',
        message: this.i18n.translate('auth.userDisabled'),
      });
    }

    if (!user.password) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: this.i18n.translate('auth.invalidCredentials'),
      });
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: this.i18n.translate('auth.invalidCredentials'),
      });
    }

    await this.userService.registerLastAccess(user.id);

    return this.jwtService.signAsync({
      sub: user.id,
      login: user.login,
    });
  }

  async me(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      return {
        authenticated: true,
        user: {
          id: payload.sub,
          login: payload.login,
        },
      };
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_TOKEN',
        message: this.i18n.translate('auth.invalidToken'),
      });
    }
  }
}
