import { Module } from '@nestjs/common';
import { TeamController, InviteAcceptController } from './team.controller';
import { TeamService } from './team.service';
import { TeamRepository } from './team.repository';

@Module({
  controllers: [TeamController, InviteAcceptController],
  providers: [TeamService, TeamRepository],
  exports: [TeamService],
})
export class TeamModule {}
