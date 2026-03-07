import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ContactsRepository } from './contacts.repository';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly contactsRepo: ContactsRepository) {}

  // =====================
  // CREATE
  // =====================

  async create(organizationId: string, dto: CreateContactDto, userId: string) {
    // Kiểm tra duplicate email trong cùng org
    if (dto.email) {
      const existing = await this.contactsRepo.findByEmail(dto.email, organizationId);
      if (existing) {
        throw new ConflictException(`Email ${dto.email} đã tồn tại trong hệ thống`);
      }
    }

    return this.contactsRepo.create(organizationId, dto, userId);
  }

  // =====================
  // FIND ALL (paginated)
  // =====================

  async findAll(organizationId: string, query: QueryContactDto) {
    const { items, total } = await this.contactsRepo.findAll(organizationId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    return { items, total, page, limit };
  }

  // =====================
  // FIND BY ID
  // =====================

  async findById(id: string, organizationId: string) {
    const contact = await this.contactsRepo.findById(id, organizationId);
    if (!contact) {
      throw new NotFoundException(`Không tìm thấy contact với ID: ${id}`);
    }
    return contact;
  }

  // =====================
  // UPDATE
  // =====================

  async update(id: string, organizationId: string, dto: UpdateContactDto, userId: string) {
    // Đảm bảo contact tồn tại và thuộc org
    await this.findById(id, organizationId);

    // Kiểm tra duplicate email nếu có thay đổi email
    if (dto.email) {
      const existing = await this.contactsRepo.findByEmail(dto.email, organizationId);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Email ${dto.email} đã được dùng bởi contact khác`);
      }
    }

    return this.contactsRepo.update(id, organizationId, dto, userId);
  }

  // =====================
  // SOFT DELETE
  // =====================

  async delete(id: string, organizationId: string) {
    // Đảm bảo contact tồn tại
    await this.findById(id, organizationId);
    return this.contactsRepo.softDelete(id, organizationId);
  }

  // =====================
  // STATS
  // =====================

  async getStats(organizationId: string) {
    return this.contactsRepo.countByStatus(organizationId);
  }

  // =====================
  // IMPORT CSV
  // =====================

  async importCsv(
    organizationId: string,
    buffer: Buffer,
    userId: string,
  ): Promise<{ created: number; skipped: number }> {
    const content = buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      throw new BadRequestException('File CSV không có dữ liệu hoặc thiếu header row');
    }

    // Parse header row — normalize tên cột
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const firstNameIdx = headers.indexOf('firstname');
    const lastNameIdx = headers.indexOf('lastname');
    const emailIdx = headers.indexOf('email');
    const phoneIdx = headers.indexOf('phone');
    const companyIdx = headers.indexOf('company');

    if (firstNameIdx === -1) {
      throw new BadRequestException('File CSV thiếu cột "firstName"');
    }

    // Lấy danh sách email đã tồn tại trong org để skip nhanh
    let created = 0;
    let skipped = 0;
    const toCreate: Array<{
      firstName: string;
      lastName?: string;
      email?: string;
      phone?: string;
      company?: string;
    }> = [];
    const seenEmails = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const firstName = cols[firstNameIdx]?.trim();

      if (!firstName) continue; // Bỏ qua row trống

      const email = emailIdx >= 0 ? cols[emailIdx]?.trim() || undefined : undefined;

      // Kiểm tra duplicate email trong file
      if (email) {
        if (seenEmails.has(email.toLowerCase())) {
          skipped++;
          continue;
        }

        // Kiểm tra duplicate trong DB
        const exists = await this.contactsRepo.findByEmail(email, organizationId);
        if (exists) {
          skipped++;
          continue;
        }

        seenEmails.add(email.toLowerCase());
      }

      toCreate.push({
        firstName,
        lastName: lastNameIdx >= 0 ? cols[lastNameIdx]?.trim() || undefined : undefined,
        email,
        phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() || undefined : undefined,
        company: companyIdx >= 0 ? cols[companyIdx]?.trim() || undefined : undefined,
      });
    }

    if (toCreate.length > 0) {
      await this.contactsRepo.bulkCreate(organizationId, toCreate, userId);
      created = toCreate.length;
    }

    return { created, skipped };
  }

  // =====================
  // EXPORT CSV
  // =====================

  async exportCsv(organizationId: string): Promise<string> {
    // Lấy tất cả contacts không phân trang
    const { items } = await this.contactsRepo.findAll(organizationId, {
      limit: 10000,
      page: 1,
    });

    const headers = ['firstName', 'lastName', 'email', 'phone', 'company', 'position', 'status', 'createdAt'];
    const rows = items.map((c) => [
      escapeCsvField(c.firstName),
      escapeCsvField(c.lastName ?? ''),
      escapeCsvField(c.email ?? ''),
      escapeCsvField(c.phone ?? ''),
      escapeCsvField(c.company ?? ''),
      escapeCsvField(c.position ?? ''),
      c.status,
      c.createdAt.toISOString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

// =====================
// CSV HELPERS
// =====================

/** Parse 1 dòng CSV hỗ trợ quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Escaped quote bên trong quoted field
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/** Escape field cho CSV output */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
