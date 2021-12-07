import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AllMetricsController } from './all-metrics/all-metrics.controller';
import { PrivacyService } from './privacy.service';
import { TrustedController } from './trusted.controller';
import { TrustedService } from './trusted.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [TrustedController, AllMetricsController],
  providers: [TrustedService, PrivacyService],
})
export class TrustedModule {}
