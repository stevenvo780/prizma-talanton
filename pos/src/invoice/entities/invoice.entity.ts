import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from '../../client/entities/client.entity';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';

export enum PaymentType {
  GatewayPayment = 'GatewayPayment',
  CashOnDelivery = 'CashOnDelivery',
  AccountReceivable = 'AccountReceivable',
  Fiar = 'Fiar',
}

export enum PaymentStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
}

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @Column()
  consecutive: number;

  @Column({ unique: true, type: 'bigint' })
  tracking_number: number;

  @Column('numeric', { precision: 10, scale: 2 })
  totalAmount: number;

  @ManyToOne(() => Client, (client) => client.invoices)
  @JoinColumn()
  client: Client;

  @Column('json')
  invoiceItems: {
    product: Product;
    sku: string;
    quantity: number;
    productPriceTypeId: number;
    price: number;
    productName: string;
    totalTax?: number;
    totalDiscount?: number;
  }[];

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn()
  @Index()
  user: User;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.GatewayPayment,
  })
  paymentType: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.Unpaid,
  })
  paymentStatus: PaymentStatus;
}
