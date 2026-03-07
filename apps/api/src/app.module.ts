import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { redisStore } from 'cache-manager-ioredis-yet';
import { PrismaModule } from './prisma/prisma.module';
import { QueuesModule } from './modules/queues/queues.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DealsModule } from './modules/deals/deals.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AiModule } from './modules/ai/ai.module';
import { EmailMarketingModule } from './modules/email-marketing/email-marketing.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TeamModule } from './modules/team/team.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    // Config — load .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),

    // Rate limiting — bảo vệ API khỏi abuse
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 giây
        limit: 10,   // 10 requests/giây
      },
      {
        name: 'long',
        ttl: 60000,  // 1 phút
        limit: 100,  // 100 requests/phút
      },
    ]),

    // Redis cache — dùng cho dashboard + search
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (cfg: ConfigService) => ({
        store: redisStore,
        host: cfg.get('REDIS_HOST', 'localhost'),
        port: cfg.get<number>('REDIS_PORT', 6379),
        password: cfg.get('REDIS_PASSWORD'),
        ttl: 60_000, // default TTL 60s
      }),
      inject: [ConfigService],
    }),

    // BullMQ root — processors sẽ kế thừa kết nối Redis này
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        connection: {
          host: cfg.get('REDIS_HOST', 'localhost'),
          port: cfg.get<number>('REDIS_PORT', 6379),
          password: cfg.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    PrismaModule,
    QueuesModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ContactsModule,
    DealsModule,
    ActivitiesModule,
    AiModule,
    EmailMarketingModule,
    ConversationsModule,
    AutomationsModule,
    DashboardModule,
    TeamModule,
    BillingModule,
    NotificationsModule,
    SearchModule,
    ProfileModule,
    AuditLogsModule,
    ApiKeysModule,
    WebhooksModule,
  ],
})
export class AppModule {
  // Inject organizationId vào request từ JWT hoặc header
  configure(consumer: MiddlewareConsumer) {
    // Logger cho tất cả routes
    consumer.apply(LoggerMiddleware).forRoutes('*');

    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/register', method: RequestMethod.POST },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
        { path: 'api/v1/invite/accept', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
