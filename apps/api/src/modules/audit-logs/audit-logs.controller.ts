import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLogsService } from './audit-logs.service';
import { AuditAction } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class AuditLogsController {
  constructor(private readonly svc: AuditLogsService) {}

  /**
   * GET /audit-logs
   * Query params: userId?, resource?, action?, dateFrom?, dateTo?, page?, limit?
   */
  @Get()
  async findMany(
    @CurrentUser() user: { organizationId: string },
    @Query('userId')   userId?: string,
    @Query('resource') resource?: string,
    @Query('action')   action?: AuditAction,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page  = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    const result = await this.svc.findMany(user.organizationId, {
      userId, resource, action, dateFrom, dateTo, page, limit,
    });
    return {
      data: result.logs,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  /** GET /audit-logs/export — tải CSV */
  @Get('export')
  async exportCsv(
    @CurrentUser() user: { organizationId: string },
    @Res() res: Response,
    @Query('userId')   userId?: string,
    @Query('resource') resource?: string,
    @Query('action')   action?: AuditAction,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?: string,
  ) {
    const csv = await this.svc.exportCsv(user.organizationId, {
      userId, resource, action, dateFrom, dateTo,
    });

    const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    res
      .setHeader('Content-Type', 'text/csv; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  }
}
