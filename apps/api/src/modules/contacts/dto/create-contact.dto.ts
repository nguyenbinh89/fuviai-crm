import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { ContactStatus } from '@prisma/client';

export class CreateContactDto {
  @ApiProperty({ example: 'Nguyễn', description: 'Tên (bắt buộc)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'nguyenvana@company.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiPropertyOptional({ example: '+84901234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Công ty ABC' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiPropertyOptional({ example: 'Giám đốc kinh doanh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Huệ, Q1, TP.HCM' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'https://company.com' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ enum: ContactStatus, default: ContactStatus.LEAD })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @ApiPropertyOptional({ example: 'Ghi chú về khách hàng' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String], description: 'Danh sách tag IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
