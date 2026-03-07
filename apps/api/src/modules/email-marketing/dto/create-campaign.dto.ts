import { IsString, IsOptional, IsEnum, IsDateString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactStatus } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Tên chiến dịch', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Tiêu đề email' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject: string;

  @ApiProperty({ description: 'Nội dung email' })
  @IsString()
  @MinLength(1)
  body: string;

  @ApiPropertyOptional({ description: 'Preview text' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  previewText?: string;

  @ApiPropertyOptional({ description: 'ID template sử dụng' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Thời gian lên lịch gửi (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ enum: ContactStatus, description: 'Lọc người nhận theo trạng thái contact' })
  @IsOptional()
  @IsEnum(ContactStatus)
  filterStatus?: ContactStatus;

  @ApiPropertyOptional({ description: 'Lọc người nhận theo Tag ID' })
  @IsOptional()
  @IsString()
  filterTagId?: string;
}
