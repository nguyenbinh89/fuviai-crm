import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import {
  AuditLogsRepository,
  CreateAuditLogInput,
  QueryAuditLogsDto,
} from './audit-logs.repository';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repo: AuditLogsRepository) {}

  /** Ghi 1 audit log — fire-and-forget từ interceptor hoặc service */
  async log(input: CreateAuditLogInput) {
    return this.repo.create(input).catch(() => {
      // Không để lỗi audit làm crash request chính
    });
  }

  async findMany(organizationId: string, query: QueryAuditLogsDto) {
    return this.repo.findMany(organizationId, query);
  }

  /** Export CSV — tối đa 10.000 dòng */
  async exportCsv(
    organizationId: string,
    query: Omit<QueryAuditLogsDto, 'page' | 'limit'>,
  ): Promise<string> {
    const logs = await this.repo.findForExport(organizationId, query);

    const header = 'Thời gian,Người dùng,Email,Hành động,Loại,ID entity,Tên entity,IP';
    const rows = logs.map((l) => {
      const userName = l.user ? `${l.user.firstName} ${l.user.lastName ?? ''}`.trim() : 'System';
      const email    = l.user?.email ?? '';
      const date     = l.createdAt.toISOString().replace('T', ' ').slice(0, 19);
      return [date, userName, email, l.action, l.resource, l.resourceId ?? '', l.resourceLabel ?? '', l.ipAddress ?? '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });

    return '\uFEFF' + [header, ...rows].join('\n'); // BOM cho Excel
  }

  // ---- Helpers gọi từ các service khác ----

  logCreate(organizationId: string, userId: string, resource: string, resourceId: string, resourceLabel: string, after: unknown, req?: { ip?: string; headers?: Record<string, string> }) {
    return this.log({
      organizationId, userId, action: AuditAction.CREATE,
      resource, resourceId, resourceLabel, after,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }

  logUpdate(organizationId: string, userId: string, resource: string, resourceId: string, resourceLabel: string, before: unknown, after: unknown, req?: { ip?: string; headers?: Record<string, string> }) {
    return this.log({
      organizationId, userId, action: AuditAction.UPDATE,
      resource, resourceId, resourceLabel, before, after,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }

  logDelete(organizationId: string, userId: string, resource: string, resourceId: string, resourceLabel: string, req?: { ip?: string; headers?: Record<string, string> }) {
    return this.log({
      organizationId, userId, action: AuditAction.DELETE,
      resource, resourceId, resourceLabel,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }
}
