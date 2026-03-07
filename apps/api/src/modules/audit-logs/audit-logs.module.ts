import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditInterceptor } from './audit-logs.interceptor';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository, AuditInterceptor],
  // Export để các module khác inject AuditLogsService + AuditInterceptor
  exports: [AuditLogsService, AuditInterceptor],
})
export class AuditLogsModule {}
