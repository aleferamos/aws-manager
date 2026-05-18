import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';

import { BillingService } from './billing.service';
import { BillingCostQueryDto } from './dto/billing-cost-query.dto';
import { CookieAuthGuard } from '../shared/auth/cookie-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/cookie-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('cost-and-usage')
  @UseGuards(CookieAuthGuard)
  async getCostAndUsage(
    @Query() query: BillingCostQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.billingService.getCostAndUsage(request.user!.id, query);
  }
}
