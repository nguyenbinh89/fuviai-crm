import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

/**
 * Health indicator tùy chỉnh cho Redis.
 * Thực hiện PING command và chờ PONG.
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private client: Redis;

  constructor(private readonly cfg: ConfigService) {
    super();
    this.client = new Redis({
      host: cfg.get('REDIS_HOST', 'localhost'),
      port: cfg.get<number>('REDIS_PORT', 6379),
      password: cfg.get('REDIS_PASSWORD'),
      lazyConnect: true,
      enableOfflineQueue: false,
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.client.ping();
      const isHealthy = result === 'PONG';
      const status = this.getStatus(key, isHealthy);

      if (isHealthy) return status;
      throw new HealthCheckError('Redis unhealthy', status);
    } catch (err) {
      const status = this.getStatus(key, false, { message: (err as Error).message });
      throw new HealthCheckError('Redis check failed', status);
    }
  }
}
