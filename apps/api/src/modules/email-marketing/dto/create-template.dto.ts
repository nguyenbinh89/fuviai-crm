import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Tên template', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Tiêu đề email' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject: string;

  @ApiProperty({ description: 'Nội dung email (HTML hoặc plain text)' })
  @IsString()
  @MinLength(1)
  body: string;

  @ApiPropertyOptional({ description: 'Preview text (hiển thị trong inbox)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  previewText?: string;

  @ApiPropertyOptional({ description: 'Đặt làm template mặc định', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
