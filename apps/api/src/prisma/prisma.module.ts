import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global module — inject PrismaService ở bất kỳ module nào mà không cần import lại
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
