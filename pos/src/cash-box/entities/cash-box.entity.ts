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

  @Column({ type: 'float' })
  cashIn: number;

  @Column({ type: 'float' })
  cashOut: number;

  @Column({ type: 'float' })
  balance: number;

  @ManyToOne(() => User, (user) => user.cashBoxes)
  @JoinColumn()
  @Index()
  user: User;

  @Column({ nullable: true })
  name?: string;
}
