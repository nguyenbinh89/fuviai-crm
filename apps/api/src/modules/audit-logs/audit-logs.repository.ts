import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAuditLogInput {
  organizationId: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  resourceLabel?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface QueryAuditLogsDto {
  userId?: string;
  resource?: string;
  action?: AuditAction;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId:         input.userId,
        action:         input.action,
        resource:       input.resource,
        resourceId:     input.resourceId,
        resourceLabel:  input.resourceLabel,
        before:         input.before as any,
        after:          input.after as any,
        metadata:       (input.metadata ?? {}) as any,
        ipAddress:      input.ipAddress,
        userAgent:      input.userAgent,
      },
    });
  }

  async findMany(organizationId: string, query: QueryAuditLogsDto) {
    const page  = query.page  ?? 1;
    const limit = Math.min(query.limit ?? 50, 100);
    const skip  = (page - 1) * limit;

    const where: any = { organizationId };
    if (query.userId)   where.userId   = query.userId;
    if (query.resource) where.resource = query.resource;
    if (query.action)   where.action   = query.action;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo)   where.createdAt.lte = new Date(query.dateTo);
    }

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  async findForExport(organizationId: string, query: Omit<QueryAuditLogsDto, 'page' | 'limit'>) {
    const where: any = { organizationId };
    if (query.userId)   where.userId   = query.userId;
    if (query.resource) where.resource = query.resource;
    if (query.action)   where.action   = query.action;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo)   where.createdAt.lte = new Date(query.dateTo);
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10_000,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }
}
