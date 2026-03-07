import { IsString, IsArray, IsEnum, ValidateNested, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'], description: 'Vai trò của message' })
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Nội dung message' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}

export class ChatDto {
  @ApiProperty({ type: [ChatMessageDto], description: 'Lịch sử chat (bao gồm message mới nhất)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
