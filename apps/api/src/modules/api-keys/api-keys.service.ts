import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateApiKeyDto {
  name: string;
  scopes?: string[];
  expiresInDays?: number;
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tạo API key mới — trả về raw key MỘT LẦN duy nhất */
  async create(organizationId: string, userId: string, dto: CreateApiKeyDto) {
    const rawKey  = `fvk_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12); // "fvk_" + 8 chars

    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 86_400_000)
      : null;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        organizationId,
        createdById: userId,
        name:        dto.name,
        keyHash,
        keyPrefix,
        scopes:    dto.scopes ?? [],
        expiresAt,
      },
      select: {
        id: true, name: true, keyPrefix: true, scopes: true,
        expiresAt: true, createdAt: true,
      },
    });

    // Trả raw key cho client — sau này không lấy lại được
    return { ...apiKey, rawKey };
  }

  async findAll(organizationId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, keyPrefix: true, scopes: true,
        lastUsedAt: true, expiresAt: true, createdAt: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async revoke(id: string, organizationId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, organizationId } });
    if (!key) throw new NotFoundException('API key không tồn tại');
    if (key.revokedAt) throw new ForbiddenException('API key đã bị thu hồi');

    return this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
      select: { id: true, name: true, revokedAt: true },
    });
  }

  /** Xác thực raw key — dùng trong ApiKeyGuard */
  async validate(rawKey: string) {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey  = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { organization: { select: { id: true, plan: true } } },
    });

    if (!apiKey || apiKey.revokedAt) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Update lastUsedAt async (fire-and-forget)
    this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    return apiKey;
  }
}
