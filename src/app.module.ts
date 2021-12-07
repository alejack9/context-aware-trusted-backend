import { Module } from '@nestjs/common';
import { AppController } from './routes/ping.controller';
import { TrustedModule } from './routes/trusted/trusted.module';

@Module({
  imports: [TrustedModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
