import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { Invoice } from '../../invoice/entities/invoice.entity';
import { User } from '../../user/entities/user.entity';

export enum TypeDocument {
  CC = 'Cédula de Ciudadanía',
  NIT = 'Número de Identificación Tributaria',
  TI = 'Tarjeta de Identidad',
}

@Entity()
export class Client {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  surname: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true, unique: true })
  documentNumber: string;

  @Column({ nullable: true })
  routeCode?: string;

  @Column({
    type: 'enum',
    enum: TypeDocument,
    default: TypeDocument.CC,
  })
  typeDocument: TypeDocument;

  @OneToMany(() => Invoice, (invoice) => invoice.client)
  invoices: Invoice[];

  @ManyToOne(() => User, (user) => user.clients)
  @JoinColumn()
  @Index()
  user: User;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  neighborhood?: string;

  @Column({ nullable: true })
  residentialGroup?: string;

  @Column({ nullable: true })
  houseNumber?: string;
}
