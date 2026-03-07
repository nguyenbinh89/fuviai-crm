import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Thứ tự quyền hạn từ cao đến thấp
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.OWNER]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.MEMBER]: 2,
  [UserRole.VIEWER]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Không có @Roles() → cho phép mọi authenticated user
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Không có quyền thực hiện thao tác này');
    }

    const userRoleLevel = ROLE_HIERARCHY[user.role as UserRole] ?? 0;
    const hasPermission = requiredRoles.some(
      (role) => userRoleLevel >= ROLE_HIERARCHY[role],
    );

    if (!hasPermission) {
      throw new ForbiddenException('Không có quyền thực hiện thao tác này');
    }

    return true;
  }
}
