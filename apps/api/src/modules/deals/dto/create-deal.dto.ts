import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStatus } from '@prisma/client';

export class CreateDealDto {
  @ApiProperty({ example: 'Deal với Công ty ABC', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 50000000, description: 'Giá trị deal' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional({ example: 'VND', default: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'pipeline-id-cuid' })
  @IsString()
  pipelineId: string;

  @ApiProperty({ example: 'stage-id-cuid' })
  @IsString()
  stageId: string;

  @ApiPropertyOptional({ example: 'contact-id-cuid' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ example: 'user-id-cuid' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional({ example: 'Ghi chú về deal này' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: DealStatus, default: DealStatus.OPEN })
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;
}
