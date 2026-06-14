import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { PlanType } from '../../user/entities/subscription.entity';

export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  ANNUALLY = 'ANNUALLY',
}

@Entity()
export class PaymentSource {
  @PrimaryGeneratedColumn()
  id: number;

  /** ID del sourceId/token cifrado (legacy Wompi, puede quedar null para MP) */
  @Column({ nullable: true })
  sourceId: string;

  /** ID de la suscripción (preapproval) en Mercado Pago */
  @Column({ nullable: true })
  mpPreapprovalId: string;

  @Column({ default: true })
  active: boolean;

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
    default: PaymentFrequency.MONTHLY,
  })
  frequency: PaymentFrequency;

  @Column({ type: 'timestamp', nullable: true })
  nextCharge: Date;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  planType: PlanType;

  @ManyToOne(() => User)
  user: User;
}
