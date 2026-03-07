import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivitiesRepository } from './activities.repository';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  controllers: [ActivitiesController, NotesController],
  providers: [ActivitiesService, ActivitiesRepository, NotesService],
  exports: [ActivitiesService, NotesService],
})
export class ActivitiesModule {}
