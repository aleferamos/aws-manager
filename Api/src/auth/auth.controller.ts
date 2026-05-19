import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import type { Response, Request } from 'express';
import { I18nService } from '../shared/i18n/i18n.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = await this.authService.login(dto);

    response.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return {
      success: true,
    };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return {
      success: true,
    };
  }

  @Get('me')
  async me(@Req() request: Request) {
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: this.i18n.translate('auth.unauthenticated'),
      });
    }

    return this.authService.me(token);
  }
}
