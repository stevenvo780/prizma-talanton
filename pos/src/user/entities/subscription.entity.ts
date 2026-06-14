import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum PlanType {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  ANNUALLY = 'ANNUALLY',
}

export const PLAN_DETAILS: Record<
  PlanType,
  { name: string; price: number; maxFacturas: number }
> = {
  [PlanType.BASIC]: {
    name: 'Básico',
    price: 25000, // Precio en COP
    maxFacturas: 20,
  },
  [PlanType.STANDARD]: {
    name: 'Estándar',
    price: 45000, // Precio en COP
    maxFacturas: 100,
  },
  [PlanType.PREMIUM]: {
    name: 'Premium',
    price: 90000, // Precio en COP
    maxFacturas: 500,
  },
};

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  user: User;

  @Column({ type: 'enum', enum: PlanType })
  planType: PlanType;

  @Column({ type: 'enum', enum: PaymentFrequency })
  frequency: PaymentFrequency;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  paymentSourceId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
