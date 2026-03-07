import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ description: 'Nội dung ghi chú', minLength: 1 })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({ description: 'ID contact liên quan' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'ID deal liên quan' })
  @IsOptional()
  @IsString()
  dealId?: string;
}
