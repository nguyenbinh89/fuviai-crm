import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/v1/auth/register
  @Post('register')
  @Public()
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 lần/phút
  @ApiOperation({ summary: 'Đăng ký tài khoản và tạo Organization' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, req.ip, req.headers['user-agent']);

    // Set refresh token vào httpOnly cookie
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    return {
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  // POST /api/v1/auth/login
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 lần/phút
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, req.ip, req.headers['user-agent']);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    return {
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  // POST /api/v1/auth/refresh
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy access token mới từ refresh token' })
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Đọc từ cookie ưu tiên, fallback body
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;

    if (!refreshToken) {
      return { data: null };
    }

    const tokens = await this.authService.refreshToken(
      refreshToken,
      req.ip,
      req.headers['user-agent'],
    );

    // Rotation: set cookie mới
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    return {
      data: { accessToken: tokens.accessToken },
    };
  }

  // POST /api/v1/auth/logout
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất (revoke refresh token)' })
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    await this.authService.logout(userId, refreshToken);

    // Xóa cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE);

    return { data: { message: 'Đăng xuất thành công' } };
  }

  // GET /api/v1/auth/me
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin user' })
  async getMe(@CurrentUser() user: { id: string; organizationId: string }) {
    const result = await this.authService.getMe(user.id, user.organizationId);
    return { data: result };
  }
}
