import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SearchResult {
  id: string;
  type: 'contact' | 'deal' | 'activity';
  title: string;
  subtitle: string;
  url: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tìm kiếm đồng thời trên contacts, deals và activities.
   * Trả về tối đa 5 kết quả mỗi loại.
   */
  async search(organizationId: string, q: string): Promise<{
    contacts: SearchResult[];
    deals: SearchResult[];
    activities: SearchResult[];
  }> {
    const term = q.trim();
    if (term.length < 2) return { contacts: [], deals: [], activities: [] };

    const [contacts, deals, activities] = await Promise.all([
      this.searchContacts(organizationId, term),
      this.searchDeals(organizationId, term),
      this.searchActivities(organizationId, term),
    ]);

    return { contacts, deals, activities };
  }

  private async searchContacts(organizationId: string, term: string): Promise<SearchResult[]> {
    const rows = await this.prisma.contact.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
          { company: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true, company: true },
    });

    return rows.map((c) => ({
      id: c.id,
      type: 'contact',
      title: `${c.firstName} ${c.lastName ?? ''}`.trim(),
      subtitle: c.company ?? c.email ?? '',
      url: `/contacts/${c.id}`,
    }));
  }

  private async searchDeals(organizationId: string, term: string): Promise<SearchResult[]> {
    const rows = await this.prisma.deal.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        title: true,
        value: true,
        status: true,
        stage: { select: { name: true } },
      },
    });

    return rows.map((d) => ({
      id: d.id,
      type: 'deal',
      title: d.title,
      subtitle: `${d.stage?.name ?? d.status} · ${(d.value / 1_000_000).toFixed(1)}M ₫`,
      url: `/deals/${d.id}`,
    }));
  }

  private async searchActivities(organizationId: string, term: string): Promise<SearchResult[]> {
    const rows = await this.prisma.activity.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { subject: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, subject: true, type: true, status: true, scheduledAt: true },
    });

    return rows.map((a) => ({
      id: a.id,
      type: 'activity',
      title: a.subject,
      subtitle: `${a.type} · ${a.status}`,
      url: `/activities`,
    }));
  }
}
