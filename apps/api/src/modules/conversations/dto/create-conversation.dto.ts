import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationChannel } from '@prisma/client';

export class CreateConversationDto {
  @ApiProperty({ description: 'ID contact' })
  @IsString()
  contactId: string;

  @ApiProperty({ enum: ConversationChannel, default: ConversationChannel.ZALO })
  @IsEnum(ConversationChannel)
  channel: ConversationChannel;

  @ApiPropertyOptional({ description: 'Zalo user ID của khách (nếu kênh Zalo)' })
  @IsOptional()
  @IsString()
  zaloUserId?: string;

  @ApiPropertyOptional({ description: 'Zalo OA ID' })
  @IsOptional()
  @IsString()
  zaloOaId?: string;

  @ApiPropertyOptional({ description: 'Tin nhắn đầu tiên' })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}
