import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  avatarUrl?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}

export class UpdateOrgSettingsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  website?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  address?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  timezone?: string;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  locale?: string;
}
