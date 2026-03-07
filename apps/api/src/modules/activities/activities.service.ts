import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesRepository } from './activities.repository';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly repo: ActivitiesRepository) {}

  // =====================
  // CREATE
  // =====================

  async create(organizationId: string, dto: CreateActivityDto, userId: string) {
    return this.repo.create(organizationId, dto, userId);
  }

  // =====================
  // FIND ALL (paginated)
  // =====================

  async findAll(organizationId: string, query: QueryActivityDto) {
    const { items, total } = await this.repo.findAll(organizationId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    return { items, total, page, limit };
  }

  // =====================
  // CALENDAR VIEW
  // =====================

  async findCalendar(organizationId: string, dateFrom: string, dateTo: string) {
    // Parse date strings thành Date objects
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return this.repo.findCalendar(organizationId, from, to);
  }

  // =====================
  // UPCOMING (7 ngày tới)
  // =====================

  async findUpcoming(organizationId: string) {
    return this.repo.findUpcoming(organizationId, 7);
  }

  // =====================
  // FIND BY ID
  // =====================

  async findById(id: string, organizationId: string) {
    const activity = await this.repo.findById(id, organizationId);
    if (!activity) {
      throw new NotFoundException(`Không tìm thấy activity với ID: ${id}`);
    }
    return activity;
  }

  // =====================
  // UPDATE
  // =====================

  async update(id: string, organizationId: string, dto: UpdateActivityDto, userId: string) {
    await this.findById(id, organizationId);
    return this.repo.update(id, organizationId, dto, userId);
  }

  // =====================
  // COMPLETE
  // =====================

  async complete(id: string, organizationId: string, userId: string) {
    await this.findById(id, organizationId);
    return this.repo.complete(id, organizationId, userId);
  }

  // =====================
  // DELETE
  // =====================

  async delete(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.repo.softDelete(id, organizationId);
  }
}
