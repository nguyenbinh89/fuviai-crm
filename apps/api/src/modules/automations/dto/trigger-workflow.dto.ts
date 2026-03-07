import { IsOptional, IsObject } from 'class-validator';

// DTO cho kích hoạt workflow thủ công
export class TriggerWorkflowDto {
  @IsOptional()
  @IsObject()
  context?: {
    contactId?: string;
    dealId?: string;
    conversationId?: string;
    [key: string]: any;
  };
}
