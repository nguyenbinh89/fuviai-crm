import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AutomationsService } from './automations.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { QueryWorkflowDto } from './dto/query-workflow.dto';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';

@Controller('automations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AutomationsController {
  constructor(private readonly service: AutomationsService) {}

  // GET /automations/stats — thống kê (TRƯỚC /:id)
  @Get('stats')
  getStats(@Req() req: any) {
    return this.service.getStats(req.user.organizationId);
  }

  // GET /automations
  @Get()
  findAll(@Req() req: any, @Query() query: QueryWorkflowDto) {
    return this.service.findAll(req.user.organizationId, query);
  }

  // POST /automations
  @Post()
  @Roles('OWNER', 'ADMIN')
  create(@Req() req: any, @Body() dto: CreateWorkflowDto) {
    return this.service.create(req.user.organizationId, dto, req.user.id);
  }

  // GET /automations/:id
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findById(id, req.user.organizationId);
  }

  // PATCH /automations/:id
  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.service.update(id, req.user.organizationId, dto, req.user.id);
  }

  // PATCH /automations/:id/activate
  @Patch(':id/activate')
  @Roles('OWNER', 'ADMIN')
  activate(@Req() req: any, @Param('id') id: string) {
    return this.service.activate(id, req.user.organizationId);
  }

  // PATCH /automations/:id/deactivate
  @Patch(':id/deactivate')
  @Roles('OWNER', 'ADMIN')
  deactivate(@Req() req: any, @Param('id') id: string) {
    return this.service.deactivate(id, req.user.organizationId);
  }

  // POST /automations/:id/trigger — kích hoạt thủ công
  @Post(':id/trigger')
  @Roles('OWNER', 'ADMIN')
  trigger(@Req() req: any, @Param('id') id: string, @Body() dto: TriggerWorkflowDto) {
    return this.service.triggerManual(id, req.user.organizationId, dto.context ?? {});
  }

  // GET /automations/:id/runs — lịch sử chạy
  @Get(':id/runs')
  getRuns(@Req() req: any, @Param('id') id: string) {
    return this.service.getRuns(id, req.user.organizationId);
  }

  // DELETE /automations/:id
  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.softDelete(id, req.user.organizationId);
  }
}
