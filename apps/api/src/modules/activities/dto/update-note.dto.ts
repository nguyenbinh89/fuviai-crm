import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNoteDto {
  @ApiProperty({ description: 'Nội dung ghi chú mới', minLength: 1 })
  @IsString()
  @MinLength(1)
  content: string;
}
