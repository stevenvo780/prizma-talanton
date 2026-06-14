import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MercadoPagoService } from './mercadopago.service';
import { MercadoPagoController } from './mercadopago.controller';
import { UserModule } from '../user/user.module';
import { PaymentSource } from './entities/payment-source.entity';
import { Subscription } from '../user/entities/subscription.entity';
import { MpSubscriptionCronService } from './mp-subscription-cron.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([PaymentSource, Subscription]),
  ],
  providers: [MercadoPagoService, MpSubscriptionCronService],
  controllers: [MercadoPagoController],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
