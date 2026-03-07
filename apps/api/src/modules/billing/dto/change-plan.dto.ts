import { IsEnum } from 'class-validator';
import { Plan, BillingCycle } from '@prisma/client';

export class ChangePlanDto {
  @IsEnum(Plan)
  plan: Plan;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}
