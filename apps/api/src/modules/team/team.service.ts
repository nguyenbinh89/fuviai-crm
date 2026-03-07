import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { TeamRepository } from './team.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { InviteMemberDto } from './dto/invite-member.dto';
import type { UpdateMemberRoleDto, UpdateMemberStatusDto } from './dto/update-member.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly repo: TeamRepository,
    private readonly prisma: PrismaService,
  ) {}

  // =====================
  // MEMBERS
  // =====================

  async getMembers(organizationId: string) {
    const members = await this.repo.findAllMembers(organizationId);
    return { data: members };
  }

  async getMemberById(id: string, organizationId: string) {
    const member = await this.repo.findMemberById(id, organizationId);
    if (!member) throw new NotFoundException('Thành viên không tồn tại');
    return { data: member };
  }

  async updateRole(
    id: string,
    organizationId: string,
    dto: UpdateMemberRoleDto,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    if (id === requestingUserId) {
      throw new BadRequestException('Không thể thay đổi role của chính mình');
    }

    const member = await this.repo.findMemberById(id, organizationId);
    if (!member) throw new NotFoundException('Thành viên không tồn tại');

    // Chỉ OWNER mới có thể set OWNER hoặc ADMIN
    if (['OWNER', 'ADMIN'].includes(dto.role) && requestingUserRole !== 'OWNER') {
      throw new ForbiddenException('Chỉ OWNER mới có thể gán role OWNER hoặc ADMIN');
    }

    // Không thể hạ role OWNER
    if (member.role === 'OWNER' && requestingUserRole !== 'OWNER') {
      throw new ForbiddenException('Không thể thay đổi role của OWNER');
    }

    const updated = await this.repo.updateRole(id, organizationId, dto.role);
    return { data: updated };
  }

  async updateStatus(id: string, organizationId: string, dto: UpdateMemberStatusDto, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new BadRequestException('Không thể thay đổi trạng thái của chính mình');
    }

    const member = await this.repo.findMemberById(id, organizationId);
    if (!member) throw new NotFoundException('Thành viên không tồn tại');
    if (member.role === 'OWNER') throw new ForbiddenException('Không thể thay đổi trạng thái OWNER');

    const updated = await this.repo.updateStatus(id, organizationId, dto.status);
    return { data: updated };
  }

  async removeMember(id: string, organizationId: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new BadRequestException('Không thể xóa chính mình khỏi tổ chức');
    }

    const member = await this.repo.findMemberById(id, organizationId);
    if (!member) throw new NotFoundException('Thành viên không tồn tại');
    if (member.role === 'OWNER') throw new ForbiddenException('Không thể xóa OWNER');

    await this.repo.removeMember(id, organizationId);
    return { data: { success: true } };
  }

  async getStats(organizationId: string) {
    const stats = await this.repo.getMemberStats(organizationId);
    return { data: stats };
  }

  // =====================
  // INVITATIONS
  // =====================

  async invite(organizationId: string, dto: InviteMemberDto, invitedById: string) {
    // Kiểm tra email đã là thành viên chưa
    const existingUser = await this.prisma.user.findFirst({
      where: { organizationId, email: dto.email, deletedAt: null },
    });
    if (existingUser) {
      throw new ConflictException('Email này đã là thành viên của tổ chức');
    }

    // Không cho mời OWNER
    if (dto.role === 'OWNER') {
      throw new BadRequestException('Không thể mời thành viên với role OWNER');
    }

    // Tạo token bảo mật
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

    const invitation = await this.repo.createInvitation({
      organizationId,
      email: dto.email,
      role: dto.role,
      token,
      expiresAt,
      invitedById,
    });

    // TODO: Gửi email thực tế với link accept
    // Hiện tại trả về token trong response để dev test
    return {
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        // Link accept (production: gửi qua email)
        acceptUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/invite/accept?token=${token}`,
      },
    };
  }

  async getPendingInvitations(organizationId: string) {
    const invitations = await this.repo.findPendingInvitations(organizationId);
    return { data: invitations };
  }

  async revokeInvitation(id: string, organizationId: string) {
    await this.repo.revokeInvitation(id, organizationId);
    return { data: { success: true } };
  }

  // Accept invitation — tạo User mới và mark invitation accepted
  async acceptInvitation(token: string, userData: { firstName: string; lastName: string; password: string }) {
    const invitation = await this.repo.findInvitationByToken(token);

    if (!invitation) throw new NotFoundException('Lời mời không hợp lệ');
    if (invitation.acceptedAt) throw new BadRequestException('Lời mời đã được chấp nhận');
    if (invitation.revokedAt) throw new BadRequestException('Lời mời đã bị thu hồi');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Lời mời đã hết hạn');

    // Kiểm tra email chưa có user
    const existing = await this.prisma.user.findFirst({
      where: { organizationId: invitation.organizationId, email: invitation.email, deletedAt: null },
    });
    if (existing) throw new ConflictException('Email này đã có tài khoản');

    // Import bcrypt inline tránh circular
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Tạo user + mark accepted trong transaction
    const [user] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          organizationId: invitation.organizationId,
          email: invitation.email,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: invitation.role,
          status: 'ACTIVE',
        },
      }),
      this.prisma.teamInvitation.update({
        where: { token },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return { data: { userId: user.id, email: user.email, role: user.role } };
  }
}
