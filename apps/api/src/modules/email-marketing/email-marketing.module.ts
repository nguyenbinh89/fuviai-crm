import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailMarketingController } from './email-marketing.controller';
import { EmailMarketingService } from './email-marketing.service';
import { EmailMarketingRepository } from './email-marketing.repository';
import { EMAIL_QUEUE } from '../queues/email-queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  controllers: [EmailMarketingController],
  providers: [EmailMarketingService, EmailMarketingRepository],
  exports: [EmailMarketingService],
})
export class EmailMarketingModule {}
