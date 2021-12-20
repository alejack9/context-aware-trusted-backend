import { Module } from '@nestjs/common';
import { AppController } from './routes/ping.controller';
import { TrustedModule } from './routes/trusted/trusted.module';
import { PrivacyModule } from './utils/privacy/privacy.module';

@Module({
  imports: [TrustedModule, PrivacyModule],
  controllers: [AppController],
})
export class AppModule {}
