import { IsString, IsOptional, IsInt, Matches, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStageDto {
  @ApiProperty({ example: 'Tiếp cận', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 0, description: 'Thứ tự hiển thị (bắt đầu từ 0)' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order: number;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Màu hex của stage' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color phải là mã màu hex hợp lệ (#RRGGBB)' })
  color?: string;

  @ApiPropertyOptional({ example: 20, description: 'Xác suất chốt deal (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  probability?: number;
}
