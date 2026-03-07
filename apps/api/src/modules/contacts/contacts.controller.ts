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
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // POST /api/v1/contacts
  @Post()
  @ApiOperation({ summary: 'Tạo contact mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async create(
    @Body() dto: CreateContactDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.contactsService.create(user.organizationId, dto, user.id);
    return { data };
  }

  // GET /api/v1/contacts/stats — PHẢI đặt trước /:id
  @Get('stats')
  @ApiOperation({ summary: 'Thống kê contacts theo status' })
  async getStats(@CurrentUser() user: { organizationId: string }) {
    const data = await this.contactsService.getStats(user.organizationId);
    return { data };
  }

  // GET /api/v1/contacts/export
  @Get('export')
  @ApiOperation({ summary: 'Export danh sách contacts ra CSV' })
  async exportCsv(
    @CurrentUser() user: { organizationId: string },
    @Res() res: Response,
  ) {
    const csv = await this.contactsService.exportCsv(user.organizationId);
    const filename = `contacts-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM để Excel hiển thị đúng tiếng Việt
  }

  // GET /api/v1/contacts
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách contacts có filter/search/pagination' })
  async findAll(
    @Query() query: QueryContactDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    const result = await this.contactsService.findAll(user.organizationId, query);
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  // GET /api/v1/contacts/:id
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 contact' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.contactsService.findById(id, user.organizationId);
    return { data };
  }

  // PATCH /api/v1/contacts/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật contact' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.contactsService.update(id, user.organizationId, dto, user.id);
    return { data };
  }

  // DELETE /api/v1/contacts/:id — ADMIN+
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Xóa contact (soft delete, ADMIN+)' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.contactsService.delete(id, user.organizationId);
    return { data: { message: 'Đã xóa contact thành công' } };
  }

  // POST /api/v1/contacts/import
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Import contacts từ CSV' })
  async importCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.contactsService.importCsv(
      user.organizationId,
      file.buffer,
      user.id,
    );
    return { data };
  }
}
