import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
import { UpdateProfileDto, ChangePasswordDto, UpdateOrgSettingsDto } from './dto/update-profile.dto';

interface JwtUser {
  sub: string;
  organizationId: string;
  role: string;
}

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly svc: ProfileService) {}

  /** GET /profile/me — thông tin user hiện tại */
  @Get('me')
  async getMe(@CurrentUser() user: JwtUser) {
    const profile = await this.svc.getProfile(user.sub, user.organizationId);
    return { data: profile };
  }

  /** PATCH /profile/me — cập nhật profile */
  @Patch('me')
  async updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    const updated = await this.svc.updateProfile(user.sub, user.organizationId, dto);
    return { data: updated };
  }

  /** POST /profile/me/change-password */
  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: JwtUser, @Body() dto: ChangePasswordDto) {
    await this.svc.changePassword(user.sub, dto);
    return { data: { success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' } };
  }

  /** GET /profile/org-settings */
  @Get('org-settings')
  async getOrgSettings(@CurrentUser() user: JwtUser) {
    const settings = await this.svc.getOrgSettings(user.organizationId);
    return { data: settings };
  }

  /** PATCH /profile/org-settings — chỉ OWNER */
  @Patch('org-settings')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  async updateOrgSettings(@CurrentUser() user: JwtUser, @Body() dto: UpdateOrgSettingsDto) {
    const updated = await this.svc.updateOrgSettings(user.organizationId, dto, user.sub);
    return { data: updated };
  }
}
