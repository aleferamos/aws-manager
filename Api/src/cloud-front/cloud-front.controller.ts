import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';

import { CloudFrontService } from './cloud-front.service';
import { CreateCloudFrontInvalidationDto } from './dto/create-cloud-front-invalidation.dto';
import { ListCloudFrontQueryDto } from './dto/list-cloud-front-query.dto';
import { CookieAuthGuard } from '../shared/auth/cookie-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/cookie-auth.guard';

@Controller('cloud-front')
export class CloudFrontController {
  constructor(private readonly cloudFrontService: CloudFrontService) {}

  @Get('distributions')
  @UseGuards(CookieAuthGuard)
  async listDistributions(
    @Query() query: ListCloudFrontQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cloudFrontService.listDistributions(request.user!.id, query);
  }

  @Get('distributions/:distributionId')
  @UseGuards(CookieAuthGuard)
  async viewDistribution(
    @Param('distributionId') distributionId: string,
    @Query() query: ListCloudFrontQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cloudFrontService.viewDistribution(
      request.user!.id,
      distributionId,
      query,
    );
  }

  @Get('distributions/:distributionId/invalidations')
  @UseGuards(CookieAuthGuard)
  async listInvalidations(
    @Param('distributionId') distributionId: string,
    @Query() query: ListCloudFrontQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cloudFrontService.listInvalidations(
      request.user!.id,
      distributionId,
      query,
    );
  }

  @Post('distributions/:distributionId/invalidations')
  @UseGuards(CookieAuthGuard)
  async createInvalidation(
    @Param('distributionId') distributionId: string,
    @Body() dto: CreateCloudFrontInvalidationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const invalidation = await this.cloudFrontService.createInvalidation(
      request.user!.id,
      distributionId,
      dto,
    );

    return {
      success: true,
      invalidation,
    };
  }
}
