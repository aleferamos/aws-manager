import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CreateInboundRuleDto } from './dto/create-inbound-rule.dto';
import { ListSecurityGroupsQueryDto } from './dto/list-security-groups-query.dto';
import { UpdateInboundRuleDto } from './dto/update-inbound-rule.dto';
import { SecurityGroupService } from './security-group.service';
import { CookieAuthGuard } from '../shared/auth/cookie-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/cookie-auth.guard';

@Controller('security-groups')
export class SecurityGroupController {
  constructor(private readonly securityGroupService: SecurityGroupService) {}

  @Get('list')
  @UseGuards(CookieAuthGuard)
  async list(
    @Query() query: ListSecurityGroupsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.securityGroupService.list(request.user!.id, query);
  }

  @Get('view/:groupId')
  @UseGuards(CookieAuthGuard)
  async view(
    @Param('groupId') groupId: string,
    @Query() query: ListSecurityGroupsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.securityGroupService.view(request.user!.id, groupId, query);
  }

  @Post(':groupId/inbound-rules')
  @UseGuards(CookieAuthGuard)
  async createInboundRule(
    @Param('groupId') groupId: string,
    @Body() createInboundRuleDto: CreateInboundRuleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.securityGroupService.createInboundRule(
      request.user!.id,
      groupId,
      createInboundRuleDto,
    );
  }

  @Patch(':groupId/inbound-rules/:ruleId')
  @UseGuards(CookieAuthGuard)
  async updateInboundRule(
    @Param('groupId') groupId: string,
    @Param('ruleId') ruleId: string,
    @Body() updateInboundRuleDto: UpdateInboundRuleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.securityGroupService.updateInboundRule(
      request.user!.id,
      groupId,
      ruleId,
      updateInboundRuleDto,
    );

    return {
      success: true,
    };
  }

  @Delete(':groupId/inbound-rules/:ruleId')
  @UseGuards(CookieAuthGuard)
  async deleteInboundRule(
    @Param('groupId') groupId: string,
    @Param('ruleId') ruleId: string,
    @Query() query: ListSecurityGroupsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.securityGroupService.deleteInboundRule(
      request.user!.id,
      groupId,
      ruleId,
      query,
    );

    return {
      success: true,
    };
  }
}
