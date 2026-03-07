import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  apiKey: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

const ORG_ID  = 'org-1';
const USER_ID = 'user-1';
const KEY_ID  = 'key-1';

const mockApiKey = {
  id: KEY_ID,
  organizationId: ORG_ID,
  name: 'Zapier Integration',
  keyHash: 'hashed',
  keyPrefix: 'fvk_abc12',
  scopes: ['contacts:read'],
  lastUsedAt: null,
  expiresAt: null,
  revokedAt: null,
  createdAt: new Date(),
  createdBy: { firstName: 'Admin', lastName: null },
};

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ApiKeysService);
  });

  // ==================
  // CREATE
  // ==================
  describe('create()', () => {
    it('nên tạo API key và trả về rawKey', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await service.create(ORG_ID, USER_ID, {
        name: 'Zapier Integration',
        scopes: ['contacts:read'],
      });

      expect(result.rawKey).toMatch(/^fvk_/);
      expect(result.name).toBe('Zapier Integration');
      expect(mockPrisma.apiKey.create).toHaveBeenCalledOnce();
    });

    it('nên hash rawKey trước khi lưu (không lưu rawKey)', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey);

      await service.create(ORG_ID, USER_ID, { name: 'Test' });

      const createCall = mockPrisma.apiKey.create.mock.calls[0][0];
      // keyHash phải khác rawKey (đã được hash)
      expect(createCall.data.keyHash).not.toMatch(/^fvk_/);
      expect(createCall.data.keyHash).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('nên set expiresAt khi truyền expiresInDays', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey);

      await service.create(ORG_ID, USER_ID, { name: 'Test', expiresInDays: 30 });

      const createCall = mockPrisma.apiKey.create.mock.calls[0][0];
      expect(createCall.data.expiresAt).toBeDefined();
    });
  });

  // ==================
  // FIND ALL
  // ==================
  describe('findAll()', () => {
    it('nên trả về danh sách API keys', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([mockApiKey]);

      const result = await service.findAll(ORG_ID);

      expect(result).toHaveLength(1);
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: ORG_ID }) }),
      );
    });
  });

  // ==================
  // REVOKE
  // ==================
  describe('revoke()', () => {
    it('nên revoke API key thành công', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(mockApiKey);
      mockPrisma.apiKey.update.mockResolvedValue({});

      await service.revoke(KEY_ID, ORG_ID);

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: KEY_ID },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('nên throw NotFoundException khi key không tồn tại', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.revoke('nonexistent', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ==================
  // VALIDATE
  // ==================
  describe('validate()', () => {
    it('nên trả về null khi key không tìm thấy', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);

      const result = await service.validate('fvk_invalid_key');
      expect(result).toBeNull();
    });

    it('nên trả về null khi key đã hết hạn', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({
        ...mockApiKey,
        expiresAt: new Date('2020-01-01'), // đã hết hạn
      });

      const result = await service.validate('fvk_some_key');
      expect(result).toBeNull();
    });

    it('nên trả về null khi key đã bị thu hồi', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({
        ...mockApiKey,
        revokedAt: new Date(),
      });

      const result = await service.validate('fvk_revoked_key');
      expect(result).toBeNull();
    });
  });
});
