import { Controller, Get, Post, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BillingService } from './billing.service';
import { ChangePlanDto } from './dto/change-plan.dto';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly service: BillingService) {}

  // GET /billing/plans — danh sách tất cả plans (không cần auth thực ra, nhưng để tiện)
  @Get('plans')
  getPlans() {
    return { data: this.service.getPlans() };
  }

  // GET /billing/current — gói hiện tại + usage
  @Get('current')
  getCurrent(@Req() req: any) {
    return this.service.getCurrentPlan(req.user.organizationId).then((data) => ({ data }));
  }

  // GET /billing/usage — usage stats
  @Get('usage')
  getUsage(@Req() req: any) {
    return this.service.getUsage(req.user.organizationId);
  }

  // GET /billing/history — lịch sử thanh toán
  @Get('history')
  getHistory(@Req() req: any) {
    return this.service.getBillingHistory(req.user.organizationId);
  }

  // POST /billing/change-plan — nâng/hạ gói (OWNER only)
  @Post('change-plan')
  @Roles('OWNER')
  changePlan(@Req() req: any, @Body() dto: ChangePlanDto) {
    return this.service.changePlan(req.user.organizationId, dto);
  }

  // Post /billing/cancel — hủy subscription (OWNER only)
  @Post('cancel')
  @Roles('OWNER')
  cancel(@Req() req: any, @Body() body: { reason?: string }) {
    return this.service.cancelSubscription(req.user.organizationId, body.reason);
  }
}
