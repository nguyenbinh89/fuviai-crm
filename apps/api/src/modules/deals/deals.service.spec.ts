import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsRepository } from './deals.repository';
import { DealStatus } from '@prisma/client';

// Mock repository
const mockRepo = {
  findPipelineById: vi.fn(),
  findStageInOrg: vi.fn(),
  create: vi.fn(),
  findAll: vi.fn(),
  findKanban: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  moveDeal: vi.fn(),
  softDelete: vi.fn(),
  getStats: vi.fn(),
};

const ORG_ID = 'org-1';
const USER_ID = 'user-1';
const PIPELINE_ID = 'pipeline-1';
const STAGE_ID = 'stage-1';
const DEAL_ID = 'deal-1';

const mockStage = {
  id: STAGE_ID,
  name: 'Tiếp cận',
  color: '#3B82F6',
  probability: 10,
  order: 0,
};

const mockPipeline = {
  id: PIPELINE_ID,
  name: 'Quy trình bán hàng',
  stages: [mockStage],
  _count: { deals: 0 },
};

const mockDeal = {
  id: DEAL_ID,
  organizationId: ORG_ID,
  title: 'Deal test',
  value: 50000000,
  currency: 'VND',
  status: DealStatus.OPEN,
  pipelineId: PIPELINE_ID,
  stageId: STAGE_ID,
  contactId: null,
  assignedToId: null,
  expectedCloseDate: null,
  closedAt: null,
  notes: null,
  customFields: {},
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  createdById: USER_ID,
  stage: mockStage,
  contact: null,
  assignedTo: null,
};

describe('DealsService', () => {
  let service: DealsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        { provide: DealsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
  });

  // =====================
  // CREATE
  // =====================
  describe('create', () => {
    const createDto = {
      title: 'Deal test',
      value: 50000000,
      pipelineId: PIPELINE_ID,
      stageId: STAGE_ID,
    };

    it('tạo deal thành công khi pipeline và stage hợp lệ', async () => {
      mockRepo.findPipelineById.mockResolvedValue(mockPipeline);
      mockRepo.create.mockResolvedValue(mockDeal);

      const result = await service.create(ORG_ID, createDto, USER_ID);

      expect(mockRepo.findPipelineById).toHaveBeenCalledWith(PIPELINE_ID, ORG_ID);
      expect(mockRepo.create).toHaveBeenCalledWith(ORG_ID, createDto, USER_ID);
      expect(result.title).toBe('Deal test');
    });

    it('ném NotFoundException khi pipeline không tồn tại', async () => {
      mockRepo.findPipelineById.mockResolvedValue(null);

      await expect(service.create(ORG_ID, createDto, USER_ID)).rejects.toThrow(NotFoundException);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('ném NotFoundException khi stage không thuộc pipeline', async () => {
      mockRepo.findPipelineById.mockResolvedValue({
        ...mockPipeline,
        stages: [{ ...mockStage, id: 'other-stage' }],
      });

      await expect(service.create(ORG_ID, createDto, USER_ID)).rejects.toThrow(NotFoundException);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  // =====================
  // FIND KANBAN
  // =====================
  describe('findKanban', () => {
    it('trả về stages với deals đúng format', async () => {
      const kanbanStages = [
        {
          ...mockStage,
          deals: [{ ...mockDeal, contact: null, assignedTo: null }],
        },
      ];

      mockRepo.findPipelineById.mockResolvedValue(mockPipeline);
      mockRepo.findKanban.mockResolvedValue(kanbanStages);

      const result = await service.findKanban(PIPELINE_ID, ORG_ID);

      expect(result.pipeline.id).toBe(PIPELINE_ID);
      expect(result.stages).toHaveLength(1);
      expect(result.stages[0].deals).toHaveLength(1);
    });

    it('ném NotFoundException khi pipeline không tồn tại', async () => {
      mockRepo.findPipelineById.mockResolvedValue(null);

      await expect(service.findKanban('nonexistent', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // =====================
  // FIND BY ID
  // =====================
  describe('findById', () => {
    it('trả về deal khi tìm thấy', async () => {
      mockRepo.findById.mockResolvedValue(mockDeal);

      const result = await service.findById(DEAL_ID, ORG_ID);

      expect(result.id).toBe(DEAL_ID);
      expect(result.title).toBe('Deal test');
    });

    it('ném NotFoundException khi không tìm thấy', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // =====================
  // MOVE DEAL
  // =====================
  describe('moveDeal', () => {
    const NEW_STAGE_ID = 'stage-2';

    it('move deal thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockDeal);
      mockRepo.findStageInOrg.mockResolvedValue({ id: NEW_STAGE_ID });
      mockRepo.moveDeal.mockResolvedValue({ ...mockDeal, stageId: NEW_STAGE_ID });

      const result = await service.moveDeal(DEAL_ID, ORG_ID, NEW_STAGE_ID, USER_ID);

      expect(mockRepo.moveDeal).toHaveBeenCalledWith(DEAL_ID, ORG_ID, NEW_STAGE_ID, USER_ID);
      expect(result.stageId).toBe(NEW_STAGE_ID);
    });

    it('ném NotFoundException khi deal không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.moveDeal('nonexistent', ORG_ID, NEW_STAGE_ID, USER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepo.moveDeal).not.toHaveBeenCalled();
    });

    it('ném NotFoundException khi stage đích không thuộc org', async () => {
      mockRepo.findById.mockResolvedValue(mockDeal);
      mockRepo.findStageInOrg.mockResolvedValue(null);

      await expect(
        service.moveDeal(DEAL_ID, ORG_ID, 'wrong-stage', USER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepo.moveDeal).not.toHaveBeenCalled();
    });
  });

  // =====================
  // UPDATE
  // =====================
  describe('update', () => {
    const updateDto = { title: 'Deal đã cập nhật', value: 100000000 };

    it('cập nhật deal thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockDeal);
      mockRepo.update.mockResolvedValue({ ...mockDeal, ...updateDto });

      const result = await service.update(DEAL_ID, ORG_ID, updateDto, USER_ID);

      expect(mockRepo.update).toHaveBeenCalledWith(DEAL_ID, ORG_ID, updateDto, USER_ID);
      expect(result.title).toBe('Deal đã cập nhật');
    });

    it('ném NotFoundException khi deal không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', ORG_ID, updateDto, USER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  // =====================
  // DELETE
  // =====================
  describe('delete', () => {
    it('soft delete thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockDeal);
      mockRepo.softDelete.mockResolvedValue({ id: DEAL_ID });

      await service.delete(DEAL_ID, ORG_ID);

      expect(mockRepo.softDelete).toHaveBeenCalledWith(DEAL_ID, ORG_ID);
    });

    it('ném NotFoundException khi deal không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent', ORG_ID)).rejects.toThrow(NotFoundException);
      expect(mockRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  // =====================
  // GET STATS
  // =====================
  describe('getStats', () => {
    it('trả về thống kê đúng format', async () => {
      const mockStats = {
        total: 10,
        totalValue: 500000000,
        winRate: 40,
        byStatus: {
          OPEN: { count: 6, totalValue: 300000000 },
          WON: { count: 3, totalValue: 150000000 },
          LOST: { count: 1, totalValue: 50000000 },
        },
      };

      mockRepo.getStats.mockResolvedValue(mockStats);

      const result = await service.getStats(ORG_ID);

      expect(result.total).toBe(10);
      expect(result.winRate).toBe(40);
      expect(result.byStatus.WON.count).toBe(3);
    });

    it('truyền pipelineId xuống repository khi có filter', async () => {
      mockRepo.getStats.mockResolvedValue({ total: 3, totalValue: 0, winRate: 0, byStatus: {} });

      await service.getStats(ORG_ID, PIPELINE_ID);

      expect(mockRepo.getStats).toHaveBeenCalledWith(ORG_ID, PIPELINE_ID);
    });
  });
});
