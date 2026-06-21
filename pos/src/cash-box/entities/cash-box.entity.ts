import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class CashBox {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  cashIn: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  cashOut: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  balance: number;

  @ManyToOne(() => User, (user) => user.cashBoxes)
  @JoinColumn()
  @Index()
  user: User;

  @Column({ nullable: true })
  name?: string;
}
