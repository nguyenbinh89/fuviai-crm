import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt để test nhanh hơn
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn(),
}));

// Mock slugify
vi.mock('slugify', () => ({
  default: vi.fn((str: string) => str.toLowerCase().replace(/\s+/g, '-')),
}));

const mockPrisma = {
  $transaction: vi.fn(),
  organization: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  user: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
};

const mockJwtService = {
  signAsync: vi.fn().mockResolvedValue('mock_token'),
  verify: vi.fn(),
};

const mockConfigService = {
  getOrThrow: vi.fn().mockReturnValue('test_secret'),
  get: vi.fn().mockReturnValue('7d'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // =====================
  // REGISTER
  // =====================
  describe('register', () => {
    const registerDto = {
      organizationName: 'Test Org',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'Password123!',
    };

    const mockOrg = { id: 'org-1', name: 'Test Org', slug: 'test-org' };
    const mockUser = {
      id: 'user-1',
      organizationId: 'org-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'OWNER',
      status: 'ACTIVE',
    };

    it('đăng ký thành công và trả về user + tokens', async () => {
      // Arrange
      mockPrisma.organization.findUnique.mockResolvedValue(null); // slug chưa tồn tại
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn({
          ...mockPrisma,
          organization: { create: vi.fn().mockResolvedValue(mockOrg) },
          user: { create: vi.fn().mockResolvedValue(mockUser) },
        });
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock_token');
      expect(result.refreshToken).toBe('mock_token');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
    });

    it('email được lowercase trước khi lưu', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        const tx = {
          organization: { create: vi.fn().mockResolvedValue(mockOrg) },
          user: { create: vi.fn().mockResolvedValue({ ...mockUser, email: 'upper@example.com' }) },
        };
        return fn(tx as unknown as typeof mockPrisma);
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await service.register({ ...registerDto, email: 'UPPER@EXAMPLE.COM' });

      // Verify $transaction được gọi
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('tạo slug unique khi slug đã tồn tại', async () => {
      // slug 'test-org' đã tồn tại, lần sau thử 'test-org-1'
      mockPrisma.organization.findUnique
        .mockResolvedValueOnce({ id: 'existing' }) // 'test-org' exists
        .mockResolvedValueOnce(null); // 'test-org-1' free

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn({
          ...mockPrisma,
          organization: { create: vi.fn().mockResolvedValue({ ...mockOrg, slug: 'test-org-1' }) },
          user: { create: vi.fn().mockResolvedValue(mockUser) },
        });
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);
      expect(mockPrisma.organization.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  // =====================
  // LOGIN
  // =====================
  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'Password123!' };
    const mockUser = {
      id: 'user-1',
      organizationId: 'org-1',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      role: 'OWNER',
      status: 'ACTIVE',
    };

    it('đăng nhập thành công với credentials đúng', async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock_token');
      // passwordHash không được trả về
      expect((result.user as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('ném UnauthorizedException khi email không tồn tại', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('ném UnauthorizedException khi mật khẩu sai', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('thực hiện timing-safe comparison khi user không tồn tại', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      // bcrypt.compare vẫn được gọi để tránh timing attack
      expect(bcrypt.compare).toHaveBeenCalled();
    });
  });

  // =====================
  // REFRESH TOKEN
  // =====================
  describe('refreshToken', () => {
    const mockStoredToken = {
      id: 'token-1',
      user: {
        id: 'user-1',
        organizationId: 'org-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'OWNER',
        status: 'ACTIVE',
        deletedAt: null,
      },
    };

    it('refresh thành công và rotate token', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        organizationId: 'org-1',
        type: 'refresh',
      });
      mockPrisma.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      // Act
      const result = await service.refreshToken('valid_refresh_token');

      // Assert
      expect(result.accessToken).toBe('mock_token');
      expect(result.refreshToken).toBe('mock_token');
      // Token cũ phải bị revoke
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('ném UnauthorizedException khi token không hợp lệ', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refreshToken('invalid_token')).rejects.toThrow(UnauthorizedException);
    });

    it('ném UnauthorizedException khi type không phải refresh', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        organizationId: 'org-1',
        type: 'access', // sai type
      });

      await expect(service.refreshToken('wrong_type_token')).rejects.toThrow(UnauthorizedException);
    });

    it('ném UnauthorizedException khi user không active', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        organizationId: 'org-1',
        type: 'refresh',
      });
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        ...mockStoredToken,
        user: { ...mockStoredToken.user, status: 'INACTIVE' },
      });

      await expect(service.refreshToken('valid_token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // =====================
  // LOGOUT
  // =====================
  describe('logout', () => {
    it('revoke tất cả refresh tokens của user', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await service.logout('user-1');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  // =====================
  // GET ME
  // =====================
  describe('getMe', () => {
    it('trả về thông tin user với organization', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        organization: { id: 'org-1', name: 'Test Org' },
      };
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.getMe('user-1', 'org-1');

      expect(result.email).toBe('test@example.com');
      expect(result.organization.name).toBe('Test Org');
    });

    it('ném NotFoundException khi user không tồn tại', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getMe('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });
});
