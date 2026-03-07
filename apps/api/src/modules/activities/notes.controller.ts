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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // POST /api/v1/notes
  @Post()
  @ApiOperation({ summary: 'Tạo ghi chú mới' })
  async create(
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.notesService.create(user.organizationId, dto, user.id);
    return { data };
  }

  // GET /api/v1/notes?contactId=...&dealId=...
  @Get()
  @ApiOperation({ summary: 'Lấy ghi chú theo context (contactId hoặc dealId)' })
  async findAll(
    @Query('contactId') contactId: string | undefined,
    @Query('dealId') dealId: string | undefined,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.notesService.findByContext(user.organizationId, contactId, dealId);
    return { data };
  }

  // PATCH /api/v1/notes/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nội dung ghi chú' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.notesService.update(id, user.organizationId, dto.content, user.id);
    return { data };
  }

  // DELETE /api/v1/notes/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa ghi chú (soft delete)' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.notesService.delete(id, user.organizationId);
    return { data: { message: 'Đã xóa ghi chú thành công' } };
  }
}
