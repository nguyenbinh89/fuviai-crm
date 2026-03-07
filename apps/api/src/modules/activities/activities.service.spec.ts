import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { NotesService } from './notes.service';
import { ActivitiesRepository } from './activities.repository';
import { ActivityType, ActivityStatus } from '@prisma/client';

// Mock repository
const mockRepo = {
  create: vi.fn(),
  findAll: vi.fn(),
  findCalendar: vi.fn(),
  findUpcoming: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  complete: vi.fn(),
  softDelete: vi.fn(),
  createNote: vi.fn(),
  findNotes: vi.fn(),
  findNoteById: vi.fn(),
  updateNote: vi.fn(),
  softDeleteNote: vi.fn(),
};

const ORG_ID = 'org-1';
const USER_ID = 'user-1';
const ACTIVITY_ID = 'activity-1';
const NOTE_ID = 'note-1';
const CONTACT_ID = 'contact-1';

const mockActivity = {
  id: ACTIVITY_ID,
  organizationId: ORG_ID,
  type: ActivityType.CALL,
  status: ActivityStatus.PENDING,
  title: 'Gọi điện chào hàng',
  description: null,
  dueDate: new Date('2026-03-10T09:00:00Z'),
  completedAt: null,
  contactId: CONTACT_ID,
  dealId: null,
  assignedToId: null,
  createdAt: new Date('2026-03-07'),
  updatedAt: new Date('2026-03-07'),
  contact: { id: CONTACT_ID, firstName: 'Nguyễn', lastName: 'Văn A' },
  deal: null,
  assignedTo: null,
};

const mockNote = {
  id: NOTE_ID,
  organizationId: ORG_ID,
  content: 'Khách quan tâm gói Pro',
  contactId: CONTACT_ID,
  dealId: null,
  createdAt: new Date('2026-03-07'),
  updatedAt: new Date('2026-03-07'),
};

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: ActivitiesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  // =====================
  // CREATE
  // =====================
  describe('create', () => {
    it('tạo activity thành công', async () => {
      mockRepo.create.mockResolvedValue(mockActivity);
      const dto = { title: 'Gọi điện chào hàng', type: ActivityType.CALL };

      const result = await service.create(ORG_ID, dto, USER_ID);

      expect(mockRepo.create).toHaveBeenCalledWith(ORG_ID, dto, USER_ID);
      expect(result.title).toBe('Gọi điện chào hàng');
      expect(result.type).toBe(ActivityType.CALL);
    });
  });

  // =====================
  // FIND ALL
  // =====================
  describe('findAll', () => {
    it('trả về danh sách activities có pagination', async () => {
      mockRepo.findAll.mockResolvedValue({ items: [mockActivity], total: 1 });

      const result = await service.findAll(ORG_ID, { page: 1, limit: 50 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });
  });

  // =====================
  // FIND BY ID
  // =====================
  describe('findById', () => {
    it('trả về activity khi tìm thấy', async () => {
      mockRepo.findById.mockResolvedValue(mockActivity);

      const result = await service.findById(ACTIVITY_ID, ORG_ID);

      expect(result.id).toBe(ACTIVITY_ID);
      expect(result.title).toBe('Gọi điện chào hàng');
    });

    it('ném NotFoundException khi không tìm thấy', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // =====================
  // UPDATE
  // =====================
  describe('update', () => {
    it('cập nhật activity thành công', async () => {
      const updated = { ...mockActivity, title: 'Gọi điện follow-up' };
      mockRepo.findById.mockResolvedValue(mockActivity);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update(ACTIVITY_ID, ORG_ID, { title: 'Gọi điện follow-up' }, USER_ID);

      expect(mockRepo.update).toHaveBeenCalledWith(ACTIVITY_ID, ORG_ID, { title: 'Gọi điện follow-up' }, USER_ID);
      expect(result.title).toBe('Gọi điện follow-up');
    });

    it('ném NotFoundException khi activity không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', ORG_ID, { title: 'X' }, USER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  // =====================
  // COMPLETE
  // =====================
  describe('complete', () => {
    it('đánh dấu activity hoàn thành thành công', async () => {
      const completed = { ...mockActivity, status: ActivityStatus.DONE, completedAt: new Date() };
      mockRepo.findById.mockResolvedValue(mockActivity);
      mockRepo.complete.mockResolvedValue(completed);

      const result = await service.complete(ACTIVITY_ID, ORG_ID, USER_ID);

      expect(mockRepo.complete).toHaveBeenCalledWith(ACTIVITY_ID, ORG_ID, USER_ID);
      expect(result.status).toBe(ActivityStatus.DONE);
      expect(result.completedAt).toBeTruthy();
    });

    it('ném NotFoundException khi activity không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.complete('nonexistent', ORG_ID, USER_ID)).rejects.toThrow(NotFoundException);
      expect(mockRepo.complete).not.toHaveBeenCalled();
    });
  });

  // =====================
  // DELETE
  // =====================
  describe('delete', () => {
    it('soft delete activity thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockActivity);
      mockRepo.softDelete.mockResolvedValue({ id: ACTIVITY_ID });

      await service.delete(ACTIVITY_ID, ORG_ID);

      expect(mockRepo.softDelete).toHaveBeenCalledWith(ACTIVITY_ID, ORG_ID);
    });

    it('ném NotFoundException khi activity không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent', ORG_ID)).rejects.toThrow(NotFoundException);
      expect(mockRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  // =====================
  // FIND CALENDAR
  // =====================
  describe('findCalendar', () => {
    it('trả về activities trong date range', async () => {
      mockRepo.findCalendar.mockResolvedValue([mockActivity]);

      const result = await service.findCalendar(ORG_ID, '2026-03-01', '2026-03-31');

      expect(mockRepo.findCalendar).toHaveBeenCalledWith(
        ORG_ID,
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );
      expect(result).toHaveLength(1);
    });
  });

  // =====================
  // FIND UPCOMING
  // =====================
  describe('findUpcoming', () => {
    it('trả về PENDING activities trong 7 ngày tới', async () => {
      mockRepo.findUpcoming.mockResolvedValue([mockActivity]);

      const result = await service.findUpcoming(ORG_ID);

      expect(mockRepo.findUpcoming).toHaveBeenCalledWith(ORG_ID, 7);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(ActivityStatus.PENDING);
    });
  });
});

// =====================
// NOTES SERVICE TESTS
// =====================
describe('NotesService', () => {
  let notesService: NotesService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: ActivitiesRepository, useValue: mockRepo },
      ],
    }).compile();

    notesService = module.get<NotesService>(NotesService);
  });

  describe('create', () => {
    it('tạo note thành công', async () => {
      mockRepo.createNote.mockResolvedValue(mockNote);
      const dto = { content: 'Khách quan tâm gói Pro', contactId: CONTACT_ID };

      const result = await notesService.create(ORG_ID, dto, USER_ID);

      expect(mockRepo.createNote).toHaveBeenCalledWith(ORG_ID, dto, USER_ID);
      expect(result.content).toBe('Khách quan tâm gói Pro');
    });
  });

  describe('findByContext', () => {
    it('trả về notes theo contactId', async () => {
      mockRepo.findNotes.mockResolvedValue([mockNote]);

      const result = await notesService.findByContext(ORG_ID, CONTACT_ID);

      expect(mockRepo.findNotes).toHaveBeenCalledWith(ORG_ID, CONTACT_ID, undefined);
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('cập nhật note thành công', async () => {
      const updated = { ...mockNote, content: 'Nội dung mới' };
      mockRepo.findNoteById.mockResolvedValue(mockNote);
      mockRepo.updateNote.mockResolvedValue(updated);

      const result = await notesService.update(NOTE_ID, ORG_ID, 'Nội dung mới', USER_ID);

      expect(mockRepo.updateNote).toHaveBeenCalledWith(NOTE_ID, ORG_ID, 'Nội dung mới', USER_ID);
      expect(result.content).toBe('Nội dung mới');
    });

    it('ném NotFoundException khi note không tồn tại', async () => {
      mockRepo.findNoteById.mockResolvedValue(null);

      await expect(
        notesService.update('nonexistent', ORG_ID, 'X', USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('soft delete note thành công', async () => {
      mockRepo.findNoteById.mockResolvedValue(mockNote);
      mockRepo.softDeleteNote.mockResolvedValue({ id: NOTE_ID });

      await notesService.delete(NOTE_ID, ORG_ID);

      expect(mockRepo.softDeleteNote).toHaveBeenCalledWith(NOTE_ID, ORG_ID);
    });

    it('ném NotFoundException khi note không tồn tại', async () => {
      mockRepo.findNoteById.mockResolvedValue(null);

      await expect(notesService.delete('nonexistent', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
