import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        logoUrl: true,
        website: true,
        phone: true,
        address: true,
        timezone: true,
        locale: true,
        settings: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: Partial<{ name: string; logoUrl: string; website: string; phone: string; address: string; timezone: string; settings: Record<string, unknown> }>) {
    return this.prisma.organization.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        logoUrl: true,
        website: true,
        phone: true,
        address: true,
        timezone: true,
        locale: true,
        settings: true,
      },
    });
  }
}
