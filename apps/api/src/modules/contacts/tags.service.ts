import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IsString, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO inline cho đơn giản
export class CreateTagDto {
  @ApiProperty({ example: 'Khách VIP' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Màu hex' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color phải là mã hex hợp lệ, vd: #3B82F6' })
  color?: string;
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.tag.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        color: true,
        _count: { select: { contacts: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(organizationId: string, dto: CreateTagDto) {
    // Kiểm tra tên tag đã tồn tại trong org
    const existing = await this.prisma.tag.findUnique({
      where: { organizationId_name: { organizationId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException(`Tag "${dto.name}" đã tồn tại`);
    }

    return this.prisma.tag.create({
      data: {
        organizationId,
        name: dto.name,
        color: dto.color ?? '#6B7280',
      },
      select: { id: true, name: true, color: true },
    });
  }

  async delete(id: string, organizationId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, organizationId },
    });
    if (!tag) {
      throw new NotFoundException(`Không tìm thấy tag với ID: ${id}`);
    }

    // Xóa tag — cascade sẽ xóa ContactTag pivot
    await this.prisma.tag.delete({ where: { id } });
    return { message: 'Đã xóa tag thành công' };
  }
}
