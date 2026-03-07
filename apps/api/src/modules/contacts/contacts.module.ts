import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactsRepository } from './contacts.repository';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
  controllers: [ContactsController, TagsController],
  providers: [ContactsService, ContactsRepository, TagsService],
  exports: [ContactsService], // Export để dùng ở modules sau (Deals, Activities...)
})
export class ContactsModule {}
