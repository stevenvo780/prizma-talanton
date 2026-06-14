import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { Taxes } from '../../taxes/entities/taxes.entity';
import { Discounts } from '../../discounts/entities/discounts.entity';
import { CategoryPricing } from '../../category-pricing/entities/category-pricing.entity';
import { User } from '../../user/entities/user.entity';

export interface ProductPriceType {
  id: number;
  sku: string;
  category: CategoryPricing;
  price: number;
  discounts?: Discounts[];
  taxes?: Taxes[];
  user: User;
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  sortName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column('json', { name: 'priceTypes' })
  priceTypes: ProductPriceType[];

  @ManyToMany(() => Category, {
    cascade: true,
  })
  @JoinTable()
  categories: Category[];

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn()
  @Index()
  user: User;

  @Column({ default: false })
  state: boolean;
}
