import { IsOptional, IsEnum, IsString } from 'class-validator';
import { TriggerType, WorkflowStatus } from '@prisma/client';

export class QueryWorkflowDto {
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @IsOptional()
  @IsString()
  search?: string;
}
