import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisHealthIndicator } from './redis-health.indicator';

/**
 * GET /health — kiểm tra DB + Redis connectivity.
 * Dùng cho load balancer / k8s liveness probe.
 * Không yêu cầu xác thực.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Kiểm tra PostgreSQL qua Prisma
      () => this.prismaHealth.pingCheck('database', this.prisma),
      // Kiểm tra Redis
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
