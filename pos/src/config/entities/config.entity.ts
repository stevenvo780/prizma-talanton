import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export interface ConfigPlugins {
  graf: {
    auth_token: '';
    enabled: boolean;
  };
  meravuelta: {
    auth_token: '';
    enabled: boolean;
  };
  fiar: {
    auth_token: '';
    enabled: boolean;
  };
}

@Entity()
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  initialConsecutive: number;

  @Column()
  finalConsecutive: number;

  @Column()
  currentConsecutive: number;

  @Column('json', {
    nullable: true,
    default: {
      graf: {
        auth_token: '',
        enabled: false,
      },
      meravuelta: {
        auth_token: '',
        enabled: false,
      },
      fiar: {
        auth_token: '',
        enabled: false,
      },
    },
  })
  pluginsConfig: ConfigPlugins;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
