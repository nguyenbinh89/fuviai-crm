import { Module } from '@nestjs/common';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { AutomationsRepository } from './automations.repository';
import { WorkflowEngineService } from './workflow-engine.service';

@Module({
  controllers: [AutomationsController],
  providers: [AutomationsService, AutomationsRepository, WorkflowEngineService],
  exports: [WorkflowEngineService], // Export để các module khác có thể trigger
})
export class AutomationsModule {}
