import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Zalo OA Webhook payload (simplified)
// Tài liệu thực: https://developers.zalo.me/docs/official-account/webhook
export class ZaloWebhookDto {
  @ApiProperty({ description: 'Loại sự kiện Zalo (oa_send_text, user_send_text, follow, ...)' })
  @IsString()
  event_name: string;

  @ApiProperty({ description: 'Timestamp Zalo' })
  timestamp: number;

  @ApiPropertyOptional({ description: 'Sender info (user gửi tin)' })
  @IsOptional()
  @IsObject()
  sender?: { id: string };

  @ApiPropertyOptional({ description: 'Recipient info (OA nhận tin)' })
  @IsOptional()
  @IsObject()
  recipient?: { id: string };

  @ApiPropertyOptional({ description: 'Message payload' })
  @IsOptional()
  @IsObject()
  message?: {
    msg_id: string;
    text?: string;
    attachments?: { type: string; payload: { url: string } }[];
  };

  @ApiPropertyOptional({ description: 'App ID' })
  @IsOptional()
  @IsString()
  app_id?: string;
}
