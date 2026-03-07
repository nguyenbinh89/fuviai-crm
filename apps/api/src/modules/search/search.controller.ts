import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly svc: SearchService) {}

  /** GET /search?q=keyword — tìm kiếm toàn hệ thống */
  @Get()
  async search(
    @Query('q') q = '',
    @CurrentUser() user: { organizationId: string },
  ) {
    const results = await this.svc.search(user.organizationId, q);
    return { data: results };
  }
}
