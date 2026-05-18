import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { CookieAuthGuard } from '../shared/auth/cookie-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/cookie-auth.guard';
import { RootAuthGuard } from '../shared/auth/root-auth.guard';
import { ListCredentialsQueryDto } from './dto/list-credentials-query.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';

@Controller('credential')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Post('create')
  @UseGuards(RootAuthGuard)
  async create(
    @Body() createCredentialDto: CreateCredentialDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.credentialService.create(createCredentialDto, request.user!.id);
  }

  @Get('list')
  @UseGuards(CookieAuthGuard)
  async list(
    @Query() query: ListCredentialsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.credentialService.list(query, request.user!.id);
  }

  @Get('view/:id')
  @UseGuards(RootAuthGuard)
  async view(@Param('id') id: string) {
    return this.credentialService.view(id);
  }

  @Put('update/:id')
  @UseGuards(RootAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCredentialDto: UpdateCredentialDto,
  ) {
    return this.credentialService.update(id, updateCredentialDto);
  }

  @Delete('delete/:id')
  @UseGuards(RootAuthGuard)
  async delete(@Param('id') id: string) {
    await this.credentialService.delete(id);

    return {
      success: true,
    };
  }
}
