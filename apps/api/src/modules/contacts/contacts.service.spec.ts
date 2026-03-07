import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsRepository } from './contacts.repository';

// Mock repository
const mockRepo = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  countByStatus: vi.fn(),
  bulkCreate: vi.fn(),
};

const ORG_ID = 'org-1';
const USER_ID = 'user-1';

const mockContact = {
  id: 'contact-1',
  organizationId: ORG_ID,
  firstName: 'Nguyễn',
  lastName: 'Văn A',
  email: 'vana@test.com',
  phone: '+84901234567',
  company: 'Công ty ABC',
  position: null,
  address: null,
  website: null,
  status: 'LEAD',
  aiScore: null,
  customFields: {},
  notes: null,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  createdById: USER_ID,
  tags: [],
};

describe('ContactsService', () => {
  let service: ContactsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: ContactsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
  });

  // =====================
  // CREATE
  // =====================
  describe('create', () => {
    const createDto = {
      firstName: 'Nguyễn',
      lastName: 'Văn A',
      email: 'vana@test.com',
    };

    it('tạo contact thành công khi email chưa tồn tại', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockContact);

      const result = await service.create(ORG_ID, createDto, USER_ID);

      expect(mockRepo.findByEmail).toHaveBeenCalledWith('vana@test.com', ORG_ID);
      expect(mockRepo.create).toHaveBeenCalledWith(ORG_ID, createDto, USER_ID);
      expect(result.firstName).toBe('Nguyễn');
    });

    it('ném ConflictException khi email đã tồn tại trong org', async () => {
      mockRepo.findByEmail.mockResolvedValue({ id: 'existing-contact' });

      await expect(service.create(ORG_ID, createDto, USER_ID)).rejects.toThrow(ConflictException);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('tạo contact không cần email', async () => {
      const dtoNoEmail = { firstName: 'Nguyễn' };
      mockRepo.create.mockResolvedValue({ ...mockContact, email: null });

      const result = await service.create(ORG_ID, dtoNoEmail, USER_ID);

      // findByEmail không được gọi khi không có email
      expect(mockRepo.findByEmail).not.toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });

  // =====================
  // FIND ALL
  // =====================
  describe('findAll', () => {
    it('trả về danh sách contacts với pagination đúng', async () => {
      mockRepo.findAll.mockResolvedValue({ items: [mockContact], total: 1 });

      const result = await service.findAll(ORG_ID, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('truyền search filter xuống repository', async () => {
      mockRepo.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll(ORG_ID, { search: 'Nguyễn', page: 1, limit: 10 });

      expect(mockRepo.findAll).toHaveBeenCalledWith(ORG_ID, {
        search: 'Nguyễn',
        page: 1,
        limit: 10,
      });
    });

    it('truyền status filter xuống repository', async () => {
      mockRepo.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll(ORG_ID, { status: 'LEAD' as any, page: 1, limit: 20 });

      expect(mockRepo.findAll).toHaveBeenCalledWith(ORG_ID, {
        status: 'LEAD',
        page: 1,
        limit: 20,
      });
    });
  });

  // =====================
  // FIND BY ID
  // =====================
  describe('findById', () => {
    it('trả về contact khi tìm thấy', async () => {
      mockRepo.findById.mockResolvedValue(mockContact);

      const result = await service.findById('contact-1', ORG_ID);

      expect(result.id).toBe('contact-1');
      expect(result.firstName).toBe('Nguyễn');
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
    const updateDto = { firstName: 'Trần', lastName: 'Thị B' };

    it('cập nhật contact thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockContact);
      mockRepo.update.mockResolvedValue({ ...mockContact, ...updateDto });

      const result = await service.update('contact-1', ORG_ID, updateDto, USER_ID);

      expect(mockRepo.update).toHaveBeenCalledWith('contact-1', ORG_ID, updateDto, USER_ID);
      expect(result.firstName).toBe('Trần');
    });

    it('ném NotFoundException khi contact không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', ORG_ID, updateDto, USER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('ném ConflictException khi email mới đã dùng bởi contact khác', async () => {
      mockRepo.findById.mockResolvedValue(mockContact);
      mockRepo.findByEmail.mockResolvedValue({ id: 'other-contact' }); // khác ID

      await expect(
        service.update('contact-1', ORG_ID, { email: 'taken@test.com' }, USER_ID),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =====================
  // DELETE
  // =====================
  describe('delete', () => {
    it('soft delete thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockContact);
      mockRepo.softDelete.mockResolvedValue({ id: 'contact-1' });

      await service.delete('contact-1', ORG_ID);

      expect(mockRepo.softDelete).toHaveBeenCalledWith('contact-1', ORG_ID);
    });

    it('ném NotFoundException khi contact không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent', ORG_ID)).rejects.toThrow(NotFoundException);
      expect(mockRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  // =====================
  // IMPORT CSV
  // =====================
  describe('importCsv', () => {
    it('import thành công: 3 tạo mới, 1 bỏ qua duplicate email', async () => {
      const csvContent = [
        'firstName,lastName,email,phone,company',
        'Nguyễn,Văn A,a@test.com,0901111111,Công ty A',
        'Trần,Thị B,b@test.com,0902222222,Công ty B',
        'Lê,Văn C,c@test.com,0903333333,Công ty C',
        'Phạm,Thị D,a@test.com,0904444444,Công ty D', // email trùng với dòng 1
      ].join('\n');

      // Email a@test.com chưa tồn tại trong DB, b và c cũng chưa
      mockRepo.findByEmail
        .mockResolvedValueOnce(null) // a@test.com không tồn tại
        .mockResolvedValueOnce(null) // b@test.com
        .mockResolvedValueOnce(null) // c@test.com
        // a@test.com dòng 4 bị skip trước khi gọi DB vì seenEmails
      mockRepo.bulkCreate.mockResolvedValue([{}, {}, {}]);

      const result = await service.importCsv(ORG_ID, Buffer.from(csvContent), USER_ID);

      expect(result.created).toBe(3);
      expect(result.skipped).toBe(1);
    });

    it('ném BadRequestException khi file không có dữ liệu', async () => {
      const emptyCSV = 'firstName,lastName,email\n'; // chỉ có header

      await expect(
        service.importCsv(ORG_ID, Buffer.from(emptyCSV), USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi thiếu cột firstName', async () => {
      const csvContent = 'email,phone\na@test.com,0901111111';

      await expect(
        service.importCsv(ORG_ID, Buffer.from(csvContent), USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('bỏ qua contact có email đã tồn tại trong DB', async () => {
      const csvContent = [
        'firstName,email',
        'Nguyễn,existing@test.com',
      ].join('\n');

      mockRepo.findByEmail.mockResolvedValue({ id: 'existing-contact' }); // đã tồn tại

      const result = await service.importCsv(ORG_ID, Buffer.from(csvContent), USER_ID);

      expect(result.created).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockRepo.bulkCreate).not.toHaveBeenCalled();
    });
  });
});
