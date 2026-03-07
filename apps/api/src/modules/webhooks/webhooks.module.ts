import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WEBHOOK_QUEUE } from '../queues/webhook-queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: WEBHOOK_QUEUE }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
