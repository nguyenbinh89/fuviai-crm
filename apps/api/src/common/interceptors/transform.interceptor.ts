import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Wrap tất cả response thành { data: T, meta?: {...} }
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        // Nếu controller đã trả về format { data, meta } thì giữ nguyên
        if (result && typeof result === 'object' && 'data' in result) {
          return result as ApiResponse<T>;
        }
        // Ngược lại wrap vào { data }
        return { data: result };
      }),
    );
  }
}
