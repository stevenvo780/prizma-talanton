import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export interface ConfigPlugins {
  hermes: {
    auth_token: '';
    enabled: boolean;
  };
  talaria: {
    auth_token: '';
    enabled: boolean;
  };
  pistis: {
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
      hermes: {
        auth_token: '',
        enabled: false,
      },
      talaria: {
        auth_token: '',
        enabled: false,
      },
      pistis: {
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
