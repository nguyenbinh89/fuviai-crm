import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TriggerType, ActionType } from '@prisma/client';

export class WorkflowActionDto {
  @IsEnum(ActionType)
  type: ActionType;

  @IsInt()
  @Min(1)
  @Max(20)
  order: number;

  @IsObject()
  config: Record<string, any>;
}

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @IsOptional()
  @IsObject()
  triggerConditions?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowActionDto)
  actions: WorkflowActionDto[];
}
