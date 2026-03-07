import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ enum: ['text', 'image', 'file'], default: 'text' })
  @IsOptional()
  @IsEnum(['text', 'image', 'file'])
  messageType?: 'text' | 'image' | 'file';

  @ApiPropertyOptional({ description: 'URL file đính kèm' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
