import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// Strategy riêng cho refresh token — đọc từ httpOnly cookie
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Ưu tiên cookie
        (req: Request) => req.cookies?.['refresh_token'],
        // Fallback: Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; organizationId: string; type: string }) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Lấy raw token từ cookie hoặc body để verify với DB
    const refreshToken = req.cookies?.['refresh_token'] || req.body?.refreshToken;

    return {
      ...payload,
      refreshToken,
    };
  }
}
