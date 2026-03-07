import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationsRepository } from './organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(private readonly organizationsRepository: OrganizationsRepository) {}

  async findById(id: string) {
    const org = await this.organizationsRepository.findById(id);
    if (!org) {
      throw new NotFoundException('Không tìm thấy tổ chức');
    }
    return org;
  }

  async update(id: string, data: Parameters<OrganizationsRepository['update']>[1]) {
    await this.findById(id);
    return this.organizationsRepository.update(id, data);
  }
}
