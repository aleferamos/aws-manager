import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';

import { Ec2Service } from './ec2.service';
import { ListEc2QueryDto } from './dto/list-ec2-query.dto';
import { CookieAuthGuard } from '../shared/auth/cookie-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/cookie-auth.guard';

@Controller('ec2')
export class Ec2Controller {
  constructor(private readonly ec2Service: Ec2Service) {}

  @Get('list')
  @UseGuards(CookieAuthGuard)
  async list(
    @Query() query: ListEc2QueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ec2Service.list(request.user!.id, query);
  }

  @Get('view/:instanceId')
  @UseGuards(CookieAuthGuard)
  async view(
    @Param('instanceId') instanceId: string,
    @Query() query: ListEc2QueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ec2Service.view(request.user!.id, instanceId, query);
  }
}
