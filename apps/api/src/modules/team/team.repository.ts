import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  status: true,
  avatarUrl: true,
  phone: true,
  lastLoginAt: true,
  createdAt: true,
};

@Injectable()
export class TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  // =====================
  // MEMBERS
  // =====================

  async findAllMembers(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId, deletedAt: null },
      select: MEMBER_SELECT,
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findMemberById(id: string, organizationId: string) {
    return this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: MEMBER_SELECT,
    });
  }

  async updateRole(id: string, organizationId: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: MEMBER_SELECT,
    });
  }

  async updateStatus(id: string, organizationId: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: MEMBER_SELECT,
    });
  }

  async removeMember(id: string, organizationId: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  async getMemberStats(organizationId: string) {
    const [total, byRole, byStatus] = await Promise.all([
      this.prisma.user.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { organizationId, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.user.groupBy({
        by: ['status'],
        where: { organizationId, deletedAt: null },
        _count: { id: true },
      }),
    ]);

    return {
      total,
      byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count.id])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
    };
  }

  // =====================
  // INVITATIONS
  // =====================

  async findPendingInvitations(organizationId: string) {
    return this.prisma.teamInvitation.findMany({
      where: {
        organizationId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findInvitationByToken(token: string) {
    return this.prisma.teamInvitation.findUnique({
      where: { token },
      include: { organization: { select: { name: true, id: true } } },
    });
  }

  async findInvitationByEmail(organizationId: string, email: string) {
    return this.prisma.teamInvitation.findUnique({
      where: { organizationId_email: { organizationId, email } },
    });
  }

  async createInvitation(data: {
    organizationId: string;
    email: string;
    role: UserRole;
    token: string;
    expiresAt: Date;
    invitedById: string;
  }) {
    // Upsert: nếu đã có (revoked/expired), tạo lại
    return this.prisma.teamInvitation.upsert({
      where: { organizationId_email: { organizationId: data.organizationId, email: data.email } },
      create: data,
      update: {
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
        acceptedAt: null,
        revokedAt: null,
        invitedById: data.invitedById,
      },
    });
  }

  async acceptInvitation(token: string) {
    return this.prisma.teamInvitation.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });
  }

  async revokeInvitation(id: string, organizationId: string) {
    return this.prisma.teamInvitation.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
