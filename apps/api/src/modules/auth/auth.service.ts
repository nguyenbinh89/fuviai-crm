import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import slugify from 'slugify';
import type { Profile } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // =====================
  // REGISTER
  // =====================

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    // Tạo slug từ tên organization
    const slug = await this.generateUniqueSlug(dto.organizationName);

    // Hash password trước khi lưu
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Tạo organization + user trong 1 transaction
    const { organization, user } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: 'OWNER', // Người đăng ký đầu tiên là OWNER
        },
        select: {
          id: true,
          organizationId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
        },
      });

      return { organization, user };
    });

    // Tạo tokens
    const tokens = await this.generateTokens(user.id, user.organizationId, user.email, user.role);

    // Lưu refresh token vào DB
    await this.saveRefreshToken(
      user.id,
      user.organizationId,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    return {
      user: {
        ...user,
        organizationName: organization.name,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // =====================
  // LOGIN
  // =====================

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    // Tìm user theo email — không filter theo org vì chưa biết org
    // Email phải unique globally hoặc user nhập cả org slug (đơn giản: unique per email)
    // Ở đây: tìm user active đầu tiên với email này
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        organizationId: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      // Tránh timing attack — vẫn so sánh hash dù không tìm thấy
      await bcrypt.compare(dto.password, '$2b$12$invalidhashforsecurity');
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tài khoản Google-only không thể đăng nhập bằng mật khẩu
    if (!user.passwordHash) {
      throw new UnauthorizedException('Tài khoản này sử dụng đăng nhập Google. Vui lòng nhấn "Đăng nhập bằng Google".');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Cập nhật lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Tạo tokens
    const tokens = await this.generateTokens(user.id, user.organizationId, user.email, user.role);

    // Lưu refresh token vào DB
    await this.saveRefreshToken(
      user.id,
      user.organizationId,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // =====================
  // REFRESH TOKEN
  // =====================

  async refreshToken(rawRefreshToken: string, ipAddress?: string, userAgent?: string) {
    let payload: { sub: string; organizationId: string; type: string };

    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token không đúng loại');
    }

    // Tìm refresh token trong DB (tìm theo userId, sau đó verify hash)
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        revokedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            organizationId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            deletedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!storedToken || storedToken.user.status !== 'ACTIVE' || storedToken.user.deletedAt) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    // Verify token hash — tránh token reuse nếu DB bị leak
    const isTokenValid = await bcrypt.compare(rawRefreshToken, storedToken.token);
    if (!isTokenValid) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    // Revoke token cũ (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Tạo token mới
    const user = storedToken.user;
    const tokens = await this.generateTokens(user.id, user.organizationId, user.email, user.role);

    await this.saveRefreshToken(
      user.id,
      user.organizationId,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    return tokens;
  }

  // =====================
  // LOGOUT
  // =====================

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Revoke refresh token cụ thể
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke tất cả sessions
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  // =====================
  // GET ME
  // =====================

  async getMe(userId: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    return user;
  }

  // =====================
  // GOOGLE OAUTH
  // =====================

  async validateGoogleUser(profile: Profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Không thể lấy email từ tài khoản Google');
    }

    // Tìm user theo googleId hoặc email
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.id }, { email: email.toLowerCase() }],
        deletedAt: null,
      },
    });

    if (user) {
      // Liên kết googleId nếu chưa có (user đăng ký email trước, giờ dùng Google)
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? profile.id,
          avatarUrl: user.avatarUrl ?? profile.photos?.[0]?.value,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Tạo mới org + user từ Google profile
      const firstName = profile.name?.givenName || 'Người dùng';
      const lastName = profile.name?.familyName || '';
      const orgName = `${firstName}${lastName ? ' ' + lastName : ''}'s Organization`;
      const slug = await this.generateUniqueSlug(orgName);

      user = await this.prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: { name: orgName, slug },
        });

        return tx.user.create({
          data: {
            organizationId: org.id,
            email: email.toLowerCase(),
            googleId: profile.id,
            firstName,
            lastName,
            avatarUrl: profile.photos?.[0]?.value,
            role: 'OWNER',
          },
        });
      });
    }

    return user;
  }

  async loginWithGoogleUser(
    user: { id: string; organizationId: string; email: string; role: string },
    ipAddress?: string,
    userAgent?: string,
  ) {
    const tokens = await this.generateTokens(
      user.id,
      user.organizationId,
      user.email,
      user.role,
    );

    await this.saveRefreshToken(
      user.id,
      user.organizationId,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    return tokens;
  }

  // =====================
  // PRIVATE HELPERS
  // =====================

  private async generateTokens(
    userId: string,
    organizationId: string,
    email: string,
    role: string,
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, organizationId, email, role, type: 'access' },
        {
          secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, organizationId, type: 'refresh' },
        {
          secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(
    userId: string,
    organizationId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Hash token trước khi lưu để bảo mật (nếu DB bị leak)
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    const expiresIn = this.config.get('JWT_REFRESH_EXPIRES', '7d');
    const days = parseInt(expiresIn.replace('d', '')) || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        organizationId,
        token: hashedToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Đảm bảo slug unique
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return slug;
  }
}
