import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(organizationId: string) {
    return this.usersRepository.findAll(organizationId);
  }

  async findById(id: string, organizationId: string) {
    const user = await this.usersRepository.findById(id, organizationId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  async updateProfile(
    id: string,
    organizationId: string,
    dto: UpdateUserDto,
    requesterId: string,
  ) {
    // Chỉ user tự cập nhật profile của mình
    if (id !== requesterId) {
      throw new ForbiddenException('Bạn chỉ có thể cập nhật profile của mình');
    }

    await this.findById(id, organizationId);
    return this.usersRepository.update(id, organizationId, dto, requesterId);
  }

  async updateRole(
    targetUserId: string,
    organizationId: string,
    dto: UpdateUserRoleDto,
    requester: { id: string; role: UserRole },
  ) {
    // Chỉ OWNER/ADMIN mới được thay đổi role
    if (requester.role === UserRole.MEMBER || requester.role === UserRole.VIEWER) {
      throw new ForbiddenException('Không có quyền thay đổi vai trò');
    }

    // ADMIN không thể tạo OWNER
    if (requester.role === UserRole.ADMIN && dto.role === UserRole.OWNER) {
      throw new ForbiddenException('ADMIN không thể gán quyền OWNER');
    }

    await this.findById(targetUserId, organizationId);
    return this.usersRepository.update(
      targetUserId,
      organizationId,
      {} as UpdateUserDto,
      requester.id,
    );
  }
}
