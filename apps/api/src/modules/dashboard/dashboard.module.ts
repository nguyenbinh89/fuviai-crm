import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [CacheModule.register()], // inherits global Redis store từ AppModule
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
