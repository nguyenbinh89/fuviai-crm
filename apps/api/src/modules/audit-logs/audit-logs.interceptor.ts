import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogsService } from './audit-logs.service';
import { AuditAction } from '@prisma/client';

/**
 * AuditInterceptor — tự động ghi audit log cho các mutation requests.
 * Áp dụng lên controller bằng @UseInterceptors(AuditInterceptor)
 * hoặc globally (nhưng thường áp dụng per-controller để kiểm soát resource name).
 *
 * Convention: controller cần set req.auditMeta = { resource, resourceId?, resourceLabel? }
 * trong handler để interceptor có đủ context.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogs: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    // Chỉ log mutating requests
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const user = req.user as { sub?: string; organizationId?: string } | undefined;
        if (!user?.organizationId || !user?.sub) return;

        const meta = req.auditMeta as {
          resource?: string;
          resourceId?: string;
          resourceLabel?: string;
          before?: unknown;
          after?: unknown;
        } | undefined;

        if (!meta?.resource) return;

        let action: AuditAction;
        if (method === 'POST')   action = AuditAction.CREATE;
        else if (method === 'DELETE') action = AuditAction.DELETE;
        else action = AuditAction.UPDATE;

        // Override action nếu endpoint có keyword đặc biệt
        const url: string = req.url ?? '';
        if (url.includes('/send'))    action = AuditAction.SEND;
        if (url.includes('/export'))  action = AuditAction.EXPORT;
        if (url.includes('/import'))  action = AuditAction.IMPORT;
        if (url.includes('/trigger')) action = AuditAction.TRIGGER;

        this.auditLogs.log({
          organizationId: user.organizationId,
          userId:         user.sub,
          action,
          resource:      meta.resource,
          resourceId:    meta.resourceId,
          resourceLabel: meta.resourceLabel,
          before:        meta.before,
          after:         meta.after,
          ipAddress:     req.ip,
          userAgent:     req.headers?.['user-agent'],
        });
      }),
    );
  }
}
