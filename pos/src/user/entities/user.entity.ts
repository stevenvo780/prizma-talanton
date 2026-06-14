import { Entity, Column, PrimaryColumn, OneToMany, OneToOne } from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { Invoice } from '../../invoice/entities/invoice.entity';
import { Client } from '../../client/entities/client.entity';
import { Category } from '../../category/entities/category.entity';
import { CashBox } from '../../cash-box/entities/cash-box.entity';
import { Discounts } from '../../discounts/entities/discounts.entity';
import { Taxes } from '../../taxes/entities/taxes.entity';
import { Profile } from '../../profile/entities/profile.entity';

export interface ConfigPlugins {
  total_pedido: {
    auth_token_total_pedido: string;
    enabled: boolean;
  };
  meravuelta: {
    auth_token_meravuelta: string;
    enabled: boolean;
  };
}

export enum PlanType {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export const PLAN_DETAILS: Record<
  PlanType,
  { name: string; price: number; maxFacturas: number }
> = {
  [PlanType.BASIC]: {
    name: 'Básico',
    price: 25000,
    maxFacturas: 20,
  },
  [PlanType.STANDARD]: {
    name: 'Estándar',
    price: 45000,
    maxFacturas: 100,
  },
  [PlanType.PREMIUM]: {
    name: 'Premium',
    price: 90000,
    maxFacturas: 500,
  },
};

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  name: string;

  @Column({ type: 'uuid', default: () => 'uuid_generate_v4()' })
  auth_token: string;

  @Column({ type: 'text', nullable: true })
  apiKey: string;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Invoice, (invoice) => invoice.user)
  invoices: Invoice[];

  @OneToMany(() => Client, (client) => client.user)
  clients: Client[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => CashBox, (cashBox) => cashBox.user)
  cashBoxes: CashBox[];

  @OneToMany(() => Taxes, (taxes) => taxes.user)
  taxes: Taxes[];

  @OneToMany(() => Discounts, (discount) => discount.user)
  discounts: Discounts[];
}
