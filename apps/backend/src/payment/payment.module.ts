import { Module } from "@nestjs/common"
import { PaymentController } from "./payment.controller"
import { PaymentService } from "./payment.service"
import { StarknetModule } from "../starknet/starknet.module"
import { TypeOrmModule } from "@nestjs/typeorm"
import { WebhookConfig } from "./entities/webhook-config.entity"
import { ScheduledPayment } from "./entities/scheduled-payment.entity"
import { PaymentLimit } from "./entities/payment-limit.entity"
import { PaymentTransaction } from "./entities/payment-transaction.entity"
import { HttpModule } from "@nestjs/axios"
import { ScheduleModule } from "@nestjs/schedule"

@Module({
  imports: [
    StarknetModule,
    TypeOrmModule.forFeature([WebhookConfig, ScheduledPayment, PaymentLimit, PaymentTransaction]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
