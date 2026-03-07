import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Mở rộng Express Request để có thêm organizationId và user
declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
      userId?: string;
      userRole?: string;
    }
  }
}

// Middleware inject organizationId vào request từ JWT payload
// Đảm bảo mọi request đều có context tenant
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      // Không có token — để guard xử lý sau
      return next();
    }

    try {
      const token = authHeader.slice(7);
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      }) as { sub: string; organizationId: string; role: string };

      // Inject vào request để sử dụng trong guards và services
      req.userId = payload.sub;
      req.organizationId = payload.organizationId;
      req.userRole = payload.role;
    } catch {
      // Token không hợp lệ — để guard xử lý, không throw ở đây
    }

    next();
  }
}
