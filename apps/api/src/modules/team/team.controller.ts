import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TeamService } from './team.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto, UpdateMemberStatusDto } from './dto/update-member.dto';

@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamController {
  constructor(private readonly service: TeamService) {}

  // GET /team/stats — thống kê members
  @Get('stats')
  getStats(@Req() req: any) {
    return this.service.getStats(req.user.organizationId);
  }

  // GET /team/members — danh sách thành viên
  @Get('members')
  getMembers(@Req() req: any) {
    return this.service.getMembers(req.user.organizationId);
  }

  // GET /team/members/:id — chi tiết thành viên
  @Get('members/:id')
  getMember(@Req() req: any, @Param('id') id: string) {
    return this.service.getMemberById(id, req.user.organizationId);
  }

  // PATCH /team/members/:id/role — đổi role (OWNER only)
  @Patch('members/:id/role')
  @Roles('OWNER', 'ADMIN')
  updateRole(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateMemberRoleDto) {
    return this.service.updateRole(
      id,
      req.user.organizationId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  // PATCH /team/members/:id/status — kích hoạt/tạm dừng
  @Patch('members/:id/status')
  @Roles('OWNER', 'ADMIN')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateMemberStatusDto) {
    return this.service.updateStatus(id, req.user.organizationId, dto, req.user.id);
  }

  // DELETE /team/members/:id — xóa thành viên
  @Delete('members/:id')
  @Roles('OWNER', 'ADMIN')
  removeMember(@Req() req: any, @Param('id') id: string) {
    return this.service.removeMember(id, req.user.organizationId, req.user.id);
  }

  // GET /team/invitations — danh sách lời mời pending
  @Get('invitations')
  getInvitations(@Req() req: any) {
    return this.service.getPendingInvitations(req.user.organizationId);
  }

  // POST /team/invitations — gửi lời mời
  @Post('invitations')
  @Roles('OWNER', 'ADMIN')
  invite(@Req() req: any, @Body() dto: InviteMemberDto) {
    return this.service.invite(req.user.organizationId, dto, req.user.id);
  }

  // DELETE /team/invitations/:id — thu hồi lời mời
  @Delete('invitations/:id')
  @Roles('OWNER', 'ADMIN')
  revokeInvitation(@Req() req: any, @Param('id') id: string) {
    return this.service.revokeInvitation(id, req.user.organizationId);
  }
}

// =====================
// Public endpoint: accept invitation (không cần JWT)
// =====================
import { Controller as NestController, Post as NestPost, Body as NestBody, Param as NestParam } from '@nestjs/common';

@NestController('invite')
export class InviteAcceptController {
  constructor(private readonly service: TeamService) {}

  // POST /invite/accept — chấp nhận lời mời (không cần auth)
  @NestPost('accept')
  acceptInvitation(
    @NestBody()
    body: {
      token: string;
      firstName: string;
      lastName: string;
      password: string;
    },
  ) {
    const { token, ...userData } = body;
    return this.service.acceptInvitation(token, userData);
  }
}
