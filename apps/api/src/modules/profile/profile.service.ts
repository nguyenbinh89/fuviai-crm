import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto, UpdateOrgSettingsDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy profile user hiện tại */
  async getProfile(userId: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        organization: {
          select: { id: true, name: true, plan: true, logoUrl: true },
        },
      },
    });
    return user;
  }

  /** Cập nhật profile (tên, avatar, phone) */
  async updateProfile(userId: string, organizationId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        updatedById: userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });
  }

  /** Đổi mật khẩu — xác thực password hiện tại trước */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const bcrypt = await import('bcrypt');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Vô hiệu hóa tất cả refresh tokens → buộc đăng nhập lại
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Lấy settings của organization */
  async getOrgSettings(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        logoUrl: true,
        website: true,
        phone: true,
        address: true,
        timezone: true,
        locale: true,
        settings: true,
        createdAt: true,
      },
    });
  }

  /** Cập nhật settings của organization — chỉ OWNER */
  async updateOrgSettings(organizationId: string, dto: UpdateOrgSettingsDto, updatedById: string) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.timezone && { timezone: dto.timezone }),
        ...(dto.locale && { locale: dto.locale }),
      },
      select: {
        id: true,
        name: true,
        plan: true,
        logoUrl: true,
        website: true,
        phone: true,
        address: true,
        timezone: true,
        locale: true,
      },
    });
  }
}
