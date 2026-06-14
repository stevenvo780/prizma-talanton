import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invoice } from '../../invoice/entities/invoice.entity';
import { User } from '../../user/entities/user.entity';

/**
 * Estado del documento electrónico ante la DIAN.
 */
export enum DianElectronicStatus {
  NOT_SENT = 'not_sent',
  PENDING = 'pending',
  STAMPED = 'stamped',
  REJECTED = 'rejected',
}

/**
 * Tipo de documento electrónico DIAN.
 */
export enum DianDocumentType {
  FACTURA_VENTA = 'FACTURA_VENTA',
  NOTA_CREDITO = 'NOTA_CREDITO',
  NOTA_DEBITO = 'NOTA_DEBITO',
}

/**
 * Entidad que registra la relación de una factura/nota del POS
 * con su documento electrónico validado ante la DIAN.
 */
@Entity()
export class DianInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  /** ID del documento en el proveedor externo (Alegra, Siigo, etc.) */
  @Column()
  providerId: string;

  /** Nombre del proveedor utilizado */
  @Column({ default: 'alegra' })
  providerName: string;

  /** Número completo del documento electrónico (ej: FE-123) */
  @Column({ nullable: true })
  documentNumber: string;

  /** Prefijo de la resolución */
  @Column({ nullable: true })
  prefix: string;

  /** CUFE – Código Único de Facturación Electrónica */
  @Column({ nullable: true, type: 'text' })
  cufe: string;

  /** Tipo de documento electrónico */
  @Column({
    type: 'enum',
    enum: DianDocumentType,
    default: DianDocumentType.FACTURA_VENTA,
  })
  documentType: DianDocumentType;

  /** Estado ante la DIAN */
  @Column({
    type: 'enum',
    enum: DianElectronicStatus,
    default: DianElectronicStatus.NOT_SENT,
  })
  dianStatus: DianElectronicStatus;

  /** Fecha de timbrado ante la DIAN */
  @Column({ nullable: true })
  stampDate: Date;

  /** Total del documento */
  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  total: number;

  /** Subtotal del documento */
  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  subtotal: number;

  /** Total impuestos */
  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  totalTax: number;

  /** URL del PDF del documento electrónico */
  @Column({ nullable: true, type: 'text' })
  pdfUrl: string;

  /** URL del XML UBL 2.1 */
  @Column({ nullable: true, type: 'text' })
  xmlUrl: string;

  /** URL del código QR */
  @Column({ nullable: true, type: 'text' })
  qrUrl: string;

  /** Respuesta cruda del proveedor (para auditoría) */
  @Column('json', { nullable: true })
  rawResponse: any;

  /** Mensaje de error si fue rechazada */
  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  /** Relación con la factura del POS */
  @ManyToOne(() => Invoice, { nullable: true })
  @JoinColumn()
  invoice: Invoice;

  /** ID de la factura original (para notas crédito/débito) */
  @Column({ nullable: true })
  originalDianInvoiceId: number;

  /** Usuario propietario */
  @ManyToOne(() => User)
  @JoinColumn()
  @Index()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
