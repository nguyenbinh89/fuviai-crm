import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { DealsRepository } from './deals.repository';
import { PipelinesController } from './pipelines.controller';
import { PipelinesService } from './pipelines.service';

@Module({
  controllers: [DealsController, PipelinesController],
  providers: [DealsService, DealsRepository, PipelinesService],
  exports: [DealsService, PipelinesService],
})
export class DealsModule {}
