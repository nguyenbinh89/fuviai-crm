import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContactStatus, Prisma } from '@prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';

// Fields bao gồm tags khi trả về contact
const CONTACT_WITH_TAGS = {
  id: true,
  organizationId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  company: true,
  position: true,
  address: true,
  website: true,
  status: true,
  aiScore: true,
  customFields: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  tags: {
    select: {
      tag: {
        select: { id: true, name: true, color: true },
      },
    },
  },
} satisfies Prisma.ContactSelect;

@Injectable()
export class ContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateContactDto, userId: string) {
    const { tagIds, ...contactData } = dto;

    return this.prisma.contact.create({
      data: {
        ...contactData,
        organizationId,
        createdById: userId,
        updatedById: userId,
        // Connect tags nếu có
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      select: CONTACT_WITH_TAGS,
    });
  }

  async findAll(organizationId: string, query: QueryContactDto) {
    const {
      search,
      status,
      tagIds,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.ContactWhereInput = {
      organizationId,
      deletedAt: null,
    };

    // Filter theo status
    if (status) {
      where.status = status;
    }

    // Search OR trong nhiều fields
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter theo tags — contact phải có ít nhất 1 trong các tag được chỉ định
    if (tagIds?.length) {
      where.tags = {
        some: { tagId: { in: tagIds } },
      };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        select: CONTACT_WITH_TAGS,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.contact.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: CONTACT_WITH_TAGS,
    });
  }

  async findByEmail(email: string, organizationId: string) {
    return this.prisma.contact.findFirst({
      where: { email, organizationId, deletedAt: null },
      select: { id: true },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateContactDto, userId: string) {
    const { tagIds, ...contactData } = dto;

    // Dùng updateMany để enforce organizationId filter (defense-in-depth)
    await this.prisma.contact.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { ...contactData, updatedById: userId },
    });

    // Sync tags nếu có, sau đó fetch record mới
    if (tagIds !== undefined) {
      await this.prisma.contactTag.deleteMany({ where: { contactId: id } });
      if (tagIds.length) {
        await this.prisma.contactTag.createMany({
          data: tagIds.map((tagId) => ({ contactId: id, tagId })),
        });
      }
    }

    return this.prisma.contact.findFirst({
      where: { id, organizationId },
      select: CONTACT_WITH_TAGS,
    });
  }

  async softDelete(id: string, organizationId: string) {
    await this.prisma.contact.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async countByStatus(organizationId: string) {
    const counts = await this.prisma.contact.groupBy({
      by: ['status'],
      where: { organizationId, deletedAt: null },
      _count: { status: true },
    });

    // Trả về object dễ dùng: { LEAD: 10, PROSPECT: 5, ... }
    const result: Record<ContactStatus, number> = {
      LEAD: 0,
      PROSPECT: 0,
      CUSTOMER: 0,
      INACTIVE: 0,
    };

    for (const row of counts) {
      result[row.status] = row._count.status;
    }

    return result;
  }

  async bulkCreate(
    organizationId: string,
    contacts: Array<{
      firstName: string;
      lastName?: string;
      email?: string;
      phone?: string;
      company?: string;
    }>,
    userId: string,
  ) {
    // Prisma không hỗ trợ createMany với relations, nên dùng transaction
    const created = await this.prisma.$transaction(
      contacts.map((c) =>
        this.prisma.contact.create({
          data: { ...c, organizationId, createdById: userId, updatedById: userId },
          select: { id: true, email: true },
        }),
      ),
    );
    return created;
  }
}
