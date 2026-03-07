import { Module } from '@nestjs/common';
import { ConversationsController, ZaloWebhookController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsRepository } from './conversations.repository';

@Module({
  controllers: [ConversationsController, ZaloWebhookController],
  providers: [ConversationsService, ConversationsRepository],
  exports: [ConversationsService],
})
export class ConversationsModule {}
