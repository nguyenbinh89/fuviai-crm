import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS — cho phép Next.js frontend
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix — exclude /health để dùng làm liveness probe
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // Global pipes — validate tất cả DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Loại bỏ fields không khai báo trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu có field lạ
      transform: true,        // Auto-transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter — format lỗi thống nhất
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptor — wrap response { data: T }
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global rate limit guard (ThrottlerModule đã khai báo trong AppModule)
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new ThrottlerGuard({}, null as any, reflector));

  // Swagger docs (chỉ trong dev/staging)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FuviAI CRM API')
      .setDescription('API documentation for FuviAI CRM')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Authorization')
      .addTag('users', 'User management')
      .addTag('organizations', 'Organization management')
      .addTag('contacts', 'Contact management & Tags')
      .addTag('deals', 'Pipeline & Deal management')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`🚀 API running: http://localhost:${port}/api/v1`);
}

bootstrap();
