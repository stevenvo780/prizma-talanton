import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum Operators {
  Percentage = '%',
  Subtraction = '-',
}

@Entity()
export class Discounts {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  value: number;

  @Column({
    type: 'enum',
    enum: Operators,
    default: Operators.Percentage,
  })
  operator: Operators;

  @ManyToOne(() => User, (user) => user.categories)
  @JoinColumn()
  @Index()
  user: User;
}
