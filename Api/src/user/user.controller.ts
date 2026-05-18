import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { SetAdminPasswordDto } from './dto/set-admin-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DefineUserPasswordDto } from './dto/define-user-password.dto';
import { ForgotUserPasswordDto } from './dto/forgot-user-password.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserViewDto } from './dto/update-user-view.dto';
import { CookieAuthGuard } from '../shared/auth/cookie-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/cookie-auth.guard';
import { RootAuthGuard } from '../shared/auth/root-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post('create')
  @UseGuards(RootAuthGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.service.create(createUserDto);
  }

  @Post('define-password')
  @HttpCode(200)
  async definePassword(@Body() defineUserPasswordDto: DefineUserPasswordDto) {
    await this.service.definePassword(defineUserPasswordDto);

    return {
      success: true,
    };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotUserPasswordDto: ForgotUserPasswordDto) {
    await this.service.forgotPassword(forgotUserPasswordDto);

    return {
      success: true,
    };
  }

  @Get('list')
  @UseGuards(RootAuthGuard)
  async list(@Query() query: ListUsersQueryDto) {
    return this.service.list(query);
  }

  @Get('view/:id')
  @UseGuards(RootAuthGuard)
  async view(@Param('id') id: string) {
    return this.service.view(id);
  }

  @Put('update/:id')
  @UseGuards(RootAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserViewDto: UpdateUserViewDto,
  ) {
    return this.service.update(id, updateUserViewDto);
  }

  @Get('get-info')
  @UseGuards(CookieAuthGuard)
  async getInfo(@Req() request: AuthenticatedRequest) {
    return this.service.getInfo(request.user!.id);
  }

  @Get('is-first-admin-user')
  async isFirstAdminUser() {
    return await this.service.adminHasPassword();
  }

  @Put('set-admin-password')
  @HttpCode(202)
  async setAdminPassword(@Body() setAdminPasswordDto: SetAdminPasswordDto) {
    await this.service.setAdminPassword(setAdminPasswordDto);
  }
}
