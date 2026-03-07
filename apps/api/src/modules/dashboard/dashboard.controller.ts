import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  // GET /dashboard/overview — KPIs tổng quan
  @Get('overview')
  getOverview(@Req() req: any) {
    return this.service.getOverview(req.user.organizationId).then((data) => ({ data }));
  }

  // GET /dashboard/revenue-chart — Doanh thu 12 tháng
  @Get('revenue-chart')
  getRevenueChart(@Req() req: any) {
    return this.service.getRevenueChart(req.user.organizationId).then((data) => ({ data }));
  }

  // GET /dashboard/pipeline-funnel?pipelineId=xxx — Pipeline funnel
  @Get('pipeline-funnel')
  getPipelineFunnel(@Req() req: any, @Query('pipelineId') pipelineId?: string) {
    return this.service
      .getPipelineFunnel(req.user.organizationId, pipelineId)
      .then((data) => ({ data }));
  }

  // GET /dashboard/activity-summary — Activity stats tháng này
  @Get('activity-summary')
  getActivitySummary(@Req() req: any) {
    return this.service.getActivitySummary(req.user.organizationId).then((data) => ({ data }));
  }

  // GET /dashboard/top-deals — Top 5 deals theo giá trị
  @Get('top-deals')
  getTopDeals(@Req() req: any) {
    return this.service.getTopDeals(req.user.organizationId).then((data) => ({ data }));
  }

  // GET /dashboard/recent-activity — 10 activities gần nhất
  @Get('recent-activity')
  getRecentActivity(@Req() req: any) {
    return this.service.getRecentActivity(req.user.organizationId).then((data) => ({ data }));
  }

  // GET /dashboard/conversion — Conversion rate stats
  @Get('conversion')
  getConversion(@Req() req: any) {
    return this.service.getConversionStats(req.user.organizationId).then((data) => ({ data }));
  }
}
