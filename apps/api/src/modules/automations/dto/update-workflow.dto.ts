import { IsString, IsOptional, IsEnum, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TriggerType, WorkflowStatus } from '@prisma/client';
import { WorkflowActionDto } from './create-workflow.dto';

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @IsOptional()
  @IsObject()
  triggerConditions?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowActionDto)
  actions?: WorkflowActionDto[];

  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;
}
