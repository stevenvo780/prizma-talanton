import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlanType } from '../../user/entities/subscription.entity';
import { PaymentFrequency } from '../entities/payment-source.entity';

export class CreateMpSubscriptionDto {
  @IsEnum(PlanType)
  planType: PlanType;

  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;

  /** card_token_id del SDK MercadoPago.js (opcional: si no se envía, MP redirige al checkout propio) */
  @IsOptional()
  @IsString()
  cardTokenId?: string;
}
