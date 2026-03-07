import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, ActivityStatus } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ description: 'Tiêu đề activity', minLength: 1, maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: ActivityType, description: 'Loại activity' })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiPropertyOptional({ enum: ActivityStatus, default: ActivityStatus.PENDING })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ngày/giờ dự kiến (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'ID contact liên quan' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'ID deal liên quan' })
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional({ description: 'ID user được giao' })
  @IsOptional()
  @IsString()
  assignedToId?: string;
}
