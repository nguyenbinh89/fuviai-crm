import { IsOptional, IsEnum, IsArray, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactStatus } from '@prisma/client';

export class QueryContactDto {
  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên, email, phone, công ty' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ContactStatus })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @ApiPropertyOptional({ type: [String], description: 'Filter theo tag IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  // Chuyển string hoặc array string từ query params
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return [value];
  })
  tagIds?: string[];

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'firstName', 'aiScore'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'aiScore' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
