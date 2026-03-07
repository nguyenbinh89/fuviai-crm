import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsRepository } from './organizations.repository';

@Module({
  providers: [OrganizationsService, OrganizationsRepository],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
