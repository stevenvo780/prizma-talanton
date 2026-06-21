import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User, ConfigPlugins } from '../../user/entities/user.entity';

export interface DianProviderConfig {
  providerName: string; // 'alegra' | 'siigo' | etc.
  email: string;
  token: string;
  baseUrl?: string;
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  nit: string;

  @Column('json', {
    nullable: true,
    default: {
      total_pedido: {
        auth_token_total_pedido: '',
        enabled: false,
      },
      talaria: {
        auth_token_talaria: '',
        enabled: false,
      },
    },
  })
  pluginsConfig: ConfigPlugins;

  @Column('json', { nullable: true })
  dianConfig: DianProviderConfig;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;
}
