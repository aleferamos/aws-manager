import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AccessService } from './access.service';
import { LinkUserAuthorityDto } from './dto/link-user-authority.dto';
import { LinkUserCredentialAuthorityDto } from './dto/link-user-credential-authority.dto';
import { LinkUserCredentialDto } from './dto/link-user-credential.dto';
import { UpdateUserCredentialDto } from './dto/update-user-credential.dto';
import { RootAuthGuard } from '../shared/auth/root-auth.guard';

@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('user/:userId')
  @UseGuards(RootAuthGuard)
  async getUserAccess(@Param('userId') userId: string) {
    return this.accessService.getUserAccess(userId);
  }

  @Get('credential/:credentialId')
  @UseGuards(RootAuthGuard)
  async getCredentialAccess(@Param('credentialId') credentialId: string) {
    return this.accessService.getCredentialAccess(credentialId);
  }

  @Get('authority/:authorityId')
  @UseGuards(RootAuthGuard)
  async getAuthorityAccess(@Param('authorityId') authorityId: string) {
    return this.accessService.getAuthorityAccess(authorityId);
  }

  @Post('user-authority')
  @UseGuards(RootAuthGuard)
  async linkUserAuthority(@Body() linkUserAuthorityDto: LinkUserAuthorityDto) {
    return this.accessService.linkUserAuthority(linkUserAuthorityDto);
  }

  @Delete('user/:userId/authority/:authorityId')
  @UseGuards(RootAuthGuard)
  async unlinkUserAuthority(
    @Param('userId') userId: string,
    @Param('authorityId') authorityId: string,
  ) {
    await this.accessService.unlinkUserAuthority(userId, authorityId);

    return {
      success: true,
    };
  }

  @Post('user-credential')
  @UseGuards(RootAuthGuard)
  async linkUserCredential(
    @Body() linkUserCredentialDto: LinkUserCredentialDto,
  ) {
    return this.accessService.linkUserCredential(linkUserCredentialDto);
  }

  @Put('user-credential/:userCredentialId')
  @UseGuards(RootAuthGuard)
  async updateUserCredential(
    @Param('userCredentialId') userCredentialId: string,
    @Body() updateUserCredentialDto: UpdateUserCredentialDto,
  ) {
    return this.accessService.updateUserCredential(
      userCredentialId,
      updateUserCredentialDto,
    );
  }

  @Delete('user-credential/:userCredentialId')
  @UseGuards(RootAuthGuard)
  async unlinkUserCredential(
    @Param('userCredentialId') userCredentialId: string,
  ) {
    await this.accessService.unlinkUserCredential(userCredentialId);

    return {
      success: true,
    };
  }

  @Post('user-credential-authority')
  @UseGuards(RootAuthGuard)
  async linkUserCredentialAuthority(
    @Body()
    linkUserCredentialAuthorityDto: LinkUserCredentialAuthorityDto,
  ) {
    return this.accessService.linkUserCredentialAuthority(
      linkUserCredentialAuthorityDto,
    );
  }

  @Delete('user-credential/:userCredentialId/authority/:authorityId')
  @UseGuards(RootAuthGuard)
  async unlinkUserCredentialAuthority(
    @Param('userCredentialId') userCredentialId: string,
    @Param('authorityId') authorityId: string,
  ) {
    await this.accessService.unlinkUserCredentialAuthority(
      userCredentialId,
      authorityId,
    );

    return {
      success: true,
    };
  }
}
