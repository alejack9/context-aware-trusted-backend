import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CloakingEngineService } from './cloaking-engine/cloaking-engine.service';
import { PrivacyService } from './privacy.service';

@Module({
  imports: [HttpModule],
  providers: [PrivacyService, CloakingEngineService],
  exports: [PrivacyService],
})
export class PrivacyModule {}
