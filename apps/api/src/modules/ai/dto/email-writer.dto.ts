import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailWriterDto {
  @ApiProperty({ description: 'Mục đích email (VD: chào hàng, follow-up, cảm ơn)' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  purpose: string;

  @ApiProperty({ description: 'Tên người nhận' })
  @IsString()
  @MinLength(1)
  contactName: string;

  @ApiPropertyOptional({ description: 'Công ty người nhận' })
  @IsOptional()
  @IsString()
  contactCompany?: string;

  @ApiPropertyOptional({ description: 'Chức vụ người nhận' })
  @IsOptional()
  @IsString()
  contactPosition?: string;

  @ApiPropertyOptional({ description: 'Tiêu đề deal liên quan' })
  @IsOptional()
  @IsString()
  dealTitle?: string;

  @ApiPropertyOptional({ description: 'Thông tin bổ sung' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalContext?: string;

  @ApiProperty({ enum: ['formal', 'friendly', 'urgent'], default: 'formal' })
  @IsEnum(['formal', 'friendly', 'urgent'])
  tone: 'formal' | 'friendly' | 'urgent';
}
