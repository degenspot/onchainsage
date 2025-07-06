import { Module } from '@nestjs/common';
import { SignalGateway } from './providers/signal-gateway';
import { SignalsModule } from 'src/signals/signals.module';

@Module({
  imports: [SignalsModule],
  providers: [SignalGateway],
})
export class SignalGatewayModule {}
