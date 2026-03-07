import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  /** GET /notifications — danh sách thông báo của user */
  @Get()
  async findMany(
    @CurrentUser() user: { sub: string; organizationId: string },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.svc.findMany(
      user.organizationId,
      user.sub,
      page,
      Math.min(limit, 50),
    );
    return {
      data: result.notifications,
      meta: { total: result.total, page, limit },
    };
  }

  /** GET /notifications/unread-count */
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: { sub: string; organizationId: string }) {
    const count = await this.svc.countUnread(user.organizationId, user.sub);
    return { data: { count } };
  }

  /** PATCH /notifications/:id/read — đánh dấu 1 thông báo đã đọc */
  @Patch(':id/read')
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; organizationId: string },
  ) {
    await this.svc.markRead(id, user.organizationId, user.sub);
    return { data: { success: true } };
  }

  /** PATCH /notifications/read-all — đánh dấu tất cả đã đọc */
  @Patch('read-all')
  async markAllRead(@CurrentUser() user: { sub: string; organizationId: string }) {
    await this.svc.markAllRead(user.organizationId, user.sub);
    return { data: { success: true } };
  }
}
