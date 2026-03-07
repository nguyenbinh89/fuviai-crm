import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Sử dụng: @Roles(UserRole.ADMIN, UserRole.OWNER)
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
