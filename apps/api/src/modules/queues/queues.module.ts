import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailQueueProcessor, EMAIL_QUEUE } from './email-queue.processor';
import { WebhookQueueProcessor, WEBHOOK_QUEUE } from './webhook-queue.processor';

@Module({
  imports: [
    // Kết nối Redis cho BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        connection: {
          host: cfg.get('REDIS_HOST', 'localhost'),
          port: cfg.get<number>('REDIS_PORT', 6379),
          password: cfg.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // Đăng ký queues
    BullModule.registerQueue(
      { name: EMAIL_QUEUE },
      { name: WEBHOOK_QUEUE },
    ),

    PrismaModule,
  ],
  providers: [EmailQueueProcessor, WebhookQueueProcessor],
  exports: [BullModule], // export BullModule để các module khác inject queues
})
export class QueuesModule {}
