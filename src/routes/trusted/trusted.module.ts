import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AllMetricsController } from './all-metrics/all-metrics.controller';
import { TrustedController } from './trusted.controller';
import { TrustedService } from './trusted.service';
import { PrivacyModule } from 'src/utils/privacy/privacy.module';

@Module({
  imports: [HttpModule, PrivacyModule],
  controllers: [TrustedController, AllMetricsController],
  providers: [TrustedService],
})
export class TrustedModule {}
