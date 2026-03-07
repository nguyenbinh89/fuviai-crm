import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityStatus, Prisma } from '@prisma/client';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { CreateNoteDto } from './dto/create-note.dto';

// Include mặc định cho Activity
const ACTIVITY_INCLUDE = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, title: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.ActivityInclude;

@Injectable()
export class ActivitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // =====================
  // ACTIVITY QUERIES
  // =====================

  async create(organizationId: string, dto: CreateActivityDto, userId: string) {
    return this.prisma.activity.create({
      data: {
        organizationId,
        type: dto.type,
        status: dto.status ?? ActivityStatus.PENDING,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        contactId: dto.contactId,
        dealId: dto.dealId,
        assignedToId: dto.assignedToId,
        createdById: userId,
        updatedById: userId,
      },
      include: ACTIVITY_INCLUDE,
    });
  }

  async findAll(organizationId: string, query: QueryActivityDto) {
    const {
      type,
      status,
      contactId,
      dealId,
      assignedToId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.ActivityWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (type) where.type = type;
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;
    if (dealId) where.dealId = dealId;
    if (assignedToId) where.assignedToId = assignedToId;

    // Lọc theo dueDate range
    if (dateFrom || dateTo) {
      where.dueDate = {};
      if (dateFrom) (where.dueDate as Prisma.DateTimeNullableFilter).gte = new Date(dateFrom);
      if (dateTo) (where.dueDate as Prisma.DateTimeNullableFilter).lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: ACTIVITY_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { items, total };
  }

  async findCalendar(organizationId: string, dateFrom: Date, dateTo: Date) {
    // Lấy tất cả activities có dueDate trong khoảng dateFrom-dateTo
    return this.prisma.activity.findMany({
      where: {
        organizationId,
        deletedAt: null,
        dueDate: { gte: dateFrom, lte: dateTo },
      },
      include: ACTIVITY_INCLUDE,
      orderBy: { dueDate: 'asc' },
    });
  }

  async findUpcoming(organizationId: string, days = 7) {
    const now = new Date();
    const until = new Date();
    until.setDate(until.getDate() + days);

    return this.prisma.activity.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: ActivityStatus.PENDING,
        dueDate: { gte: now, lte: until },
      },
      include: ACTIVITY_INCLUDE,
      orderBy: { dueDate: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.activity.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: ACTIVITY_INCLUDE,
    });
  }

  async update(id: string, organizationId: string, dto: UpdateActivityDto, userId: string) {
    return this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        updatedById: userId,
      },
      include: ACTIVITY_INCLUDE,
    });
  }

  async complete(id: string, organizationId: string, userId: string) {
    return this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.DONE,
        completedAt: new Date(),
        updatedById: userId,
      },
      include: ACTIVITY_INCLUDE,
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.activity.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  // =====================
  // NOTE QUERIES
  // =====================

  async createNote(organizationId: string, dto: CreateNoteDto, userId: string) {
    return this.prisma.note.create({
      data: {
        organizationId,
        content: dto.content,
        contactId: dto.contactId,
        dealId: dto.dealId,
        createdById: userId,
        updatedById: userId,
      },
    });
  }

  async findNotes(organizationId: string, contactId?: string, dealId?: string) {
    const where: Prisma.NoteWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (contactId) where.contactId = contactId;
    if (dealId) where.dealId = dealId;

    return this.prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNoteById(id: string, organizationId: string) {
    return this.prisma.note.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async updateNote(id: string, organizationId: string, content: string, userId: string) {
    return this.prisma.note.update({
      where: { id },
      data: { content, updatedById: userId },
    });
  }

  async softDeleteNote(id: string, organizationId: string) {
    return this.prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }
}
