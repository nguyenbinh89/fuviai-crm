import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesRepository } from './activities.repository';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly repo: ActivitiesRepository) {}

  // =====================
  // CREATE
  // =====================

  async create(organizationId: string, dto: CreateNoteDto, userId: string) {
    return this.repo.createNote(organizationId, dto, userId);
  }

  // =====================
  // FIND BY CONTEXT
  // =====================

  async findByContext(organizationId: string, contactId?: string, dealId?: string) {
    return this.repo.findNotes(organizationId, contactId, dealId);
  }

  // =====================
  // UPDATE
  // =====================

  async update(id: string, organizationId: string, content: string, userId: string) {
    // Kiểm tra note thuộc org
    const note = await this.repo.findNoteById(id, organizationId);
    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú với ID: ${id}`);
    }
    return this.repo.updateNote(id, organizationId, content, userId);
  }

  // =====================
  // DELETE
  // =====================

  async delete(id: string, organizationId: string) {
    const note = await this.repo.findNoteById(id, organizationId);
    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú với ID: ${id}`);
    }
    return this.repo.softDeleteNote(id, organizationId);
  }
}
