import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { EmailWriterDto } from './dto/email-writer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // POST /api/v1/ai/chat — FuviBot chat
  @Post('chat')
  @ApiOperation({ summary: 'FuviBot: gửi message và nhận phản hồi AI' })
  @ApiResponse({ status: 201, description: 'Reply từ FuviBot' })
  async chat(
    @Body() dto: ChatDto,
    @CurrentUser() user: { id: string; organizationId: string; firstName: string; organizationName?: string },
  ) {
    const data = await this.aiService.chat(dto, {
      organizationId: user.organizationId,
      organizationName: user.organizationName ?? 'Tổ chức của bạn',
      userName: user.firstName,
    });
    return { data };
  }

  // POST /api/v1/ai/contacts/:id/score — Lead scoring
  @Post('contacts/:id/score')
  @ApiOperation({ summary: 'Chấm điểm tiềm năng của contact bằng AI' })
  @ApiResponse({ status: 201, description: 'Lead score result' })
  async scoreContact(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.aiService.scoreContact(id, user.organizationId);
    return { data };
  }

  // POST /api/v1/ai/email-writer — AI Email Writer
  @Post('email-writer')
  @ApiOperation({ summary: 'Soạn email bằng AI' })
  @ApiResponse({ status: 201, description: 'Email draft (subject + body)' })
  async writeEmail(@Body() dto: EmailWriterDto) {
    const data = await this.aiService.writeEmail(dto);
    return { data };
  }
}
