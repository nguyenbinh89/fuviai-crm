import { IsEnum, IsOptional } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateMemberStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
