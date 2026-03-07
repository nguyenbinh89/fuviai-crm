import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveDealDto {
  @ApiProperty({ example: 'stage-id-cuid', description: 'ID của stage đích' })
  @IsString()
  stageId: string;
}
