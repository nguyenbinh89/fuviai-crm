import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditAction } from '@prisma/client';

const mockRepo = {
  create: vi.fn(),
  findMany: vi.fn(),
  findForExport: vi.fn(),
};

const ORG_ID = 'org-1';

describe('AuditLogsService', () => {
  let service: AuditLogsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        { provide: AuditLogsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(AuditLogsService);
  });

  // ==================
  // LOG
  // ==================
  describe('log()', () => {
    it('nên ghi audit log và không ném lỗi', async () => {
      mockRepo.create.mockResolvedValue({ id: 'log-1' });

      await service.log({
        organizationId: ORG_ID,
        action: AuditAction.CREATE,
        resource: 'Contact',
        resourceId: 'contact-1',
        resourceLabel: 'Nguyễn Văn A',
        userId: 'user-1',
      });

      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it('nên không crash khi repo.create ném lỗi (fire-and-forget)', async () => {
      mockRepo.create.mockRejectedValue(new Error('DB error'));

      // Không nên ném lỗi ra ngoài
      await expect(
        service.log({
          organizationId: ORG_ID,
          action: AuditAction.DELETE,
          resource: 'Deal',
          resourceId: 'deal-1',
          resourceLabel: 'Test Deal',
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ==================
  // FIND MANY
  // ==================
  describe('findMany()', () => {
    it('nên trả về danh sách audit logs có phân trang', async () => {
      mockRepo.findMany.mockResolvedValue({
        items: [{ id: 'log-1', action: 'CREATE', resource: 'Contact' }],
        total: 1,
      });

      const result = await service.findMany(ORG_ID, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  // ==================
  // EXPORT CSV
  // ==================
  describe('exportCsv()', () => {
    it('nên trả về CSV string với UTF-8 BOM', async () => {
      mockRepo.findForExport.mockResolvedValue([
        {
          id: 'log-1',
          createdAt: new Date('2026-03-07T10:00:00Z'),
          action: 'CREATE',
          resource: 'Contact',
          resourceId: 'c-1',
          resourceLabel: 'Nguyễn Văn A',
          userId: 'u-1',
          user: { firstName: 'Admin', lastName: null },
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla',
        },
      ]);

      const csv = await service.exportCsv(ORG_ID, {});

      expect(csv).toMatch(/^\uFEFF/); // UTF-8 BOM
      expect(csv).toContain('CREATE');
      expect(csv).toContain('Contact');
    });

    it('nên trả về chỉ header khi không có data', async () => {
      mockRepo.findForExport.mockResolvedValue([]);

      const csv = await service.exportCsv(ORG_ID, {});

      expect(csv).toMatch(/^\uFEFF/);
      const lines = csv.split('\n');
      expect(lines.length).toBe(2); // BOM+header và 1 dòng trống
    });
  });
});
