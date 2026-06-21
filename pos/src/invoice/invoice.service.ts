import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Invoice, PaymentStatus, PaymentType } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { ConfigService } from '../config/config.service';
import { CashBoxService } from '../cash-box/cash-box.service';
import { User } from '../user/entities/user.entity';
import { Product } from '../product/entities/product.entity';
import { Client } from '../client/entities/client.entity';
import { TalariaService } from '../talaria/talaria.service';
import { MailjetService } from '../mailjet/mailjet.service';
import { EventBusService } from '../shared/event-bus.service';
import { PrizmaHubLegacyService } from '../prizma-hub/prizma-hub.service';
import { PrizmaHubService } from '../prizma/prizma-hub.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private configService: ConfigService,
    private cashBoxService: CashBoxService,
    private mailjetService: MailjetService,
    private eventBusService: EventBusService,
    private prizmaHubLegacy: PrizmaHubLegacyService,
    private prizmaHub: PrizmaHubService,
    private dataSource: DataSource,
  ) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
    user: User,
    id: number | string,
  ) {
    let newInvoice = await this.invoiceRepository.findOne({
      where: { tracking_number: createInvoiceDto.tracking_number },
    });
    if (!newInvoice) {
      newInvoice = new Invoice();
    }

    // Pre-fetch and validate all products before transaction
    const productIds: number[] = [];
    for (let i = 0; i < createInvoiceDto.invoiceItems.length; i++) {
      const item = createInvoiceDto.invoiceItems[i];

      let product;
      if (item.product) {
        product = await this.productRepository.findOne({
          where: { id: item.product as number },
        });
      }

      if (!product && item.sku) {
        product = await this.productRepository
          .createQueryBuilder('product')
          .where('product."priceTypes"::jsonb @> :filter', {
            filter: JSON.stringify([{ sku: item.sku }]),
          })
          .getOne();
      }

      if (!product) {
        console.error('product not found for item:', item);
        throw new HttpException(
          `Product not found for item: ${
            item.productName || item.sku || 'unknown'
          }`,
          HttpStatus.NOT_FOUND,
        );
      }

      productIds.push(product.id);
      createInvoiceDto.invoiceItems[i].product = product as any;
    }

    let client = await this.clientRepository.findOne({
      where: { id: createInvoiceDto.client.id },
    });
    if (!client) {
      client = new Client();
      Object.assign(client, createInvoiceDto.client);
      client.user = user;
      client = await this.clientRepository.save(client);
    }
    createInvoiceDto.client = client;

    if (!createInvoiceDto.tracking_number) {
      createInvoiceDto.tracking_number =
        await this.generateUniqueDeliveryNumber();
    }

    try {
      // Execute invoice creation and stock decrement in a database transaction
      const invoice = await this.dataSource.transaction(async (manager) => {
        // Step 1: Atomically check and decrement stock for all products
        for (let i = 0; i < createInvoiceDto.invoiceItems.length; i++) {
          const item = createInvoiceDto.invoiceItems[i];
          const quantity = item.quantity || 1;
          const productId = (item.product as any).id;

          // Use UPDATE with WHERE condition to atomically decrement stock
          // This ensures two concurrent requests cannot both pass the stock check
          const updateResult = await manager.update(
            Product,
            {
              id: productId,
              stock: In([quantity, quantity + 1, quantity + 2, quantity + 3, quantity + 4, quantity + 5]) // Flexible: allow multiple concurrent decrements
            } as any, // Use raw WHERE clause below instead
            { stock: () => `stock - ${quantity}` },
          );

          // If the above doesn't work well, use raw query for atomic decrement with condition
          const rawResult = await manager.query(
            `UPDATE product SET stock = stock - $1 WHERE id = $2 AND stock >= $1`,
            [quantity, productId],
          );

          if (rawResult.affectedRows === 0) {
            throw new HttpException(
              `Insufficient stock for product: requested ${quantity}`,
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        // Step 2: Atomically increment consecutive counter
        const newConsecutive = await this.configService.incrementConsecutiveAtomic(user.id);
        createInvoiceDto.consecutive = newConsecutive;

        // Step 3: Save invoice
        Object.assign(newInvoice, createInvoiceDto);
        newInvoice.date = new Date();
        newInvoice.user = user;

        return await manager.save(Invoice, newInvoice);
      });

      try {
        await this.cashBoxService.cashIn(id, +invoice.totalAmount, user.id);
      } catch (cashBoxError) {
        console.error('cash-box error during invoice creation:', cashBoxError);
        throw new HttpException(
          'Error al actualizar caja: ' + (cashBoxError.message || String(cashBoxError)),
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Publish invoice created event for plugins to process asynchronously
      await this.eventBusService.publishInvoiceCreated(invoice, user.id);

      // Legacy: webhook HTTP al sink histórico del Hub (venta-pos-creada).
      // Se conserva mientras el receptor migra al envelope canónico de
      // prizma-contracts. No bloqueante: un Hub caído no rompe la venta.
      await this.prizmaHubLegacy.sendVentaPOSCreada(invoice, user);

      // 🌊 Prizma: publicar venta_pos.creada (EVENTS.POS_SALE_CREATED) vía el
      // HubClient canónico de prizma-contracts (source="talanton", Flujo 3).
      // No bloqueante: el HubClient es tolerante a fallos y nunca lanza hacia
      // la lógica de negocio, así que un Hub caído no rompe la venta.
      await this.prizmaHub
        .publishPosSaleCreated(invoice, user)
        .catch(() => undefined);

      // Handle email sending synchronously (as it's not a plugin)
      if (client.email && invoice.paymentStatus === PaymentStatus.Paid) {
        try {
          const sent = await this.mailjetService.sendInvoiceEmail(
            invoice,
            client,
          );
          console.log(`Resultado envío de correo: ${sent}`);
        } catch (emailError) {
          console.error('Error enviando correo de factura:', emailError);
        }
      }

      return invoice;
    } catch (error) {
      console.error('invoice-create', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al crear factura: ' + (error.message || String(error)),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findAll(userId: string) {
    return this.invoiceRepository.find({
      where: { user: { id: userId } },
      relations: ['client'],
      order: { id: 'DESC' },
    });
  }

  async findAllWithFilters(userId: string, filters: FilterInvoiceDto) {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .where('invoice.user = :userId', { userId });

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      queryBuilder.andWhere('invoice.date >= :startDate', {
        startDate,
      });
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('invoice.date <= :endDate', {
        endDate,
      });
    }

    if (filters.clientId) {
      queryBuilder.andWhere('client.id = :clientId', {
        clientId: filters.clientId,
      });
    }
    if (filters.clientSearch) {
      queryBuilder.andWhere(
        '(client.name ILIKE :clientSearch OR client.surname ILIKE :clientSearch OR client.documentNumber ILIKE :clientSearch)',
        { clientSearch: `%${filters.clientSearch}%` },
      );
    }

    if (filters.consecutiveStart) {
      queryBuilder.andWhere('invoice.consecutive >= :consecutiveStart', {
        consecutiveStart: filters.consecutiveStart,
      });
    }
    if (filters.consecutiveEnd) {
      queryBuilder.andWhere('invoice.consecutive <= :consecutiveEnd', {
        consecutiveEnd: filters.consecutiveEnd,
      });
    }

    if (filters.trackingNumber) {
      queryBuilder.andWhere('invoice.tracking_number = :trackingNumber', {
        trackingNumber: filters.trackingNumber,
      });
    }

    if (filters.paymentType) {
      queryBuilder.andWhere('invoice.paymentType = :paymentType', {
        paymentType: filters.paymentType,
      });
    }
    if (filters.paymentStatus) {
      queryBuilder.andWhere('invoice.paymentStatus = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }

    if (filters.minAmount) {
      queryBuilder.andWhere('invoice.totalAmount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }
    if (filters.maxAmount) {
      queryBuilder.andWhere('invoice.totalAmount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }

    const sortBy = filters.sortBy || 'id';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`invoice.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [invoices, total] = await queryBuilder.getManyAndCount();

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportToExcel(userId: string, filters: FilterInvoiceDto) {
    const filtersForExport = { ...filters, page: 1, limit: 10000 };
    const { data: invoices } = await this.findAllWithFilters(
      userId,
      filtersForExport,
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Facturas');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Consecutivo', key: 'consecutive', width: 15 },
      { header: 'Número de Seguimiento', key: 'tracking_number', width: 20 },
      { header: 'Cliente', key: 'clientName', width: 30 },
      { header: 'Documento Cliente', key: 'clientDocument', width: 20 },
      { header: 'Email Cliente', key: 'clientEmail', width: 30 },
      { header: 'Teléfono Cliente', key: 'clientPhone', width: 15 },
      { header: 'Monto Total', key: 'totalAmount', width: 15 },
      { header: 'Tipo de Pago', key: 'paymentType', width: 20 },
      { header: 'Estado de Pago', key: 'paymentStatus', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    invoices.forEach((invoice) => {
      worksheet.addRow({
        id: invoice.id,
        date: new Date(invoice.date).toLocaleDateString(),
        consecutive: invoice.consecutive,
        tracking_number: invoice.tracking_number,
        clientName: `${invoice.client.name} ${
          invoice.client.surname || ''
        }`.trim(),
        clientDocument: invoice.client.documentNumber,
        clientEmail: invoice.client.email,
        clientPhone: invoice.client.phone,
        totalAmount: invoice.totalAmount,
        paymentType: this.getPaymentTypeLabel(invoice.paymentType),
        paymentStatus: this.getPaymentStatusLabel(invoice.paymentStatus),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getPaymentTypeLabel(paymentType: PaymentType): string {
    const labels = {
      [PaymentType.GatewayPayment]: 'Pago por Pasarela',
      [PaymentType.CashOnDelivery]: 'Pago Contra Entrega',
      [PaymentType.AccountReceivable]: 'Cuenta por Cobrar',
      [PaymentType.Fiar]: 'Fiar',
    };
    return labels[paymentType] || paymentType;
  }

  private getPaymentStatusLabel(paymentStatus: PaymentStatus): string {
    const labels = {
      [PaymentStatus.Paid]: 'Pagado',
      [PaymentStatus.Unpaid]: 'Sin Pagar',
    };
    return labels[paymentStatus] || paymentStatus;
  }

  findOne(id: number, userId: string) {
    return this.invoiceRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['client'],
    });
  }

  async update(id: number, updateInvoiceDto: UpdateInvoiceDto, userId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['client', 'user'],
    });
    if (!invoice) {
      throw new Error('Invoice not found or does not belong to user');
    }
    const previousPaymentStatus = invoice.paymentStatus;
    Object.assign(invoice, updateInvoiceDto);

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Publish invoice updated event for plugins to process asynchronously
    await this.eventBusService.publishInvoiceUpdated(
      updatedInvoice,
      invoice.user.id,
    );

    // If payment status changed to paid, publish payment completed event
    if (
      previousPaymentStatus !== PaymentStatus.Paid &&
      updatedInvoice.paymentStatus === PaymentStatus.Paid
    ) {
      await this.eventBusService.publishPaymentCompleted(
        updatedInvoice,
        invoice.user.id,
      );
    }

    // Handle email sending synchronously (as it's not a plugin)
    if (invoice.client.email && invoice.paymentStatus === PaymentStatus.Paid) {
      try {
        const sent = await this.mailjetService.sendInvoiceEmail(
          invoice,
          invoice.client,
        );
        console.log(`Resultado envío de correo: ${sent}`);
      } catch (emailError) {
        console.error('Error enviando correo de factura:', emailError);
      }
    }

    return { affected: 1 };
  }

  async remove(id: number, userId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!invoice) {
      throw new Error('Invoice not found or does not belong to user');
    }
    return this.invoiceRepository.delete(id);
  }

  async exportProductsSummary(userId: string, filters: FilterInvoiceDto) {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .where('invoice.user = :userId', { userId });

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      queryBuilder.andWhere('invoice.date >= :startDate', {
        startDate,
      });
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('invoice.date <= :endDate', {
        endDate,
      });
    }
    if (filters.clientId) {
      queryBuilder.andWhere('client.id = :clientId', {
        clientId: filters.clientId,
      });
    }
    if (filters.clientSearch) {
      queryBuilder.andWhere(
        '(client.name ILIKE :clientSearch OR client.surname ILIKE :clientSearch OR client.documentNumber ILIKE :clientSearch)',
        { clientSearch: `%${filters.clientSearch}%` },
      );
    }
    if (filters.consecutiveStart) {
      queryBuilder.andWhere('invoice.consecutive >= :consecutiveStart', {
        consecutiveStart: filters.consecutiveStart,
      });
    }
    if (filters.consecutiveEnd) {
      queryBuilder.andWhere('invoice.consecutive <= :consecutiveEnd', {
        consecutiveEnd: filters.consecutiveEnd,
      });
    }
    if (filters.trackingNumber) {
      queryBuilder.andWhere('invoice.tracking_number = :trackingNumber', {
        trackingNumber: filters.trackingNumber,
      });
    }
    if (filters.paymentType) {
      queryBuilder.andWhere('invoice.paymentType = :paymentType', {
        paymentType: filters.paymentType,
      });
    }
    if (filters.paymentStatus) {
      queryBuilder.andWhere('invoice.paymentStatus = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }
    if (filters.minAmount) {
      queryBuilder.andWhere('invoice.totalAmount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }
    if (filters.maxAmount) {
      queryBuilder.andWhere('invoice.totalAmount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }

    const invoices = await queryBuilder.getMany();

    const productSummary = new Map<
      string,
      {
        productName: string;
        productSku: string;
        totalQuantity: number;
        totalRevenue: number;
        orderCount: number;
      }
    >();

    invoices.forEach((invoice) => {
      invoice.invoiceItems.forEach((item) => {
        const key = `${item.productName}`;
        const existing = productSummary.get(key);

        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.price * item.quantity;
          existing.orderCount += 1;
        } else {
          productSummary.set(key, {
            productName: item.productName,
            productSku: item.sku || 'N/A',
            totalQuantity: item.quantity,
            totalRevenue: item.price * item.quantity,
            orderCount: 1,
          });
        }
      });
    });

    const sortedProducts = Array.from(productSummary.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity,
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resumen de Productos');

    worksheet.addRow(['RESUMEN DE PRODUCTOS SOLICITADOS']);
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.mergeCells('A1:F1');
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    const filterInfo = [];
    if (filters.startDate) filterInfo.push(`Desde: ${filters.startDate}`);
    if (filters.endDate) filterInfo.push(`Hasta: ${filters.endDate}`);
    if (filters.clientSearch)
      filterInfo.push(`Cliente: ${filters.clientSearch}`);
    if (filters.paymentType)
      filterInfo.push(
        `Tipo de Pago: ${this.getPaymentTypeLabel(filters.paymentType)}`,
      );
    if (filters.paymentStatus)
      filterInfo.push(
        `Estado: ${this.getPaymentStatusLabel(filters.paymentStatus)}`,
      );

    if (filterInfo.length > 0) {
      worksheet.addRow([`Filtros aplicados: ${filterInfo.join(', ')}`]);
      worksheet.getRow(2).font = { italic: true };
      worksheet.mergeCells('A2:F2');
    }

    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'Producto',
      'SKU',
      'Cantidad Total',
      'Ingresos Totales',
      'Número de Órdenes',
      'Promedio por Orden',
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    sortedProducts.forEach((product) => {
      const avgPerOrder = product.totalQuantity / product.orderCount;
      const row = worksheet.addRow([
        product.productName,
        product.productSku,
        product.totalQuantity,
        product.totalRevenue,
        product.orderCount,
        Math.round(avgPerOrder * 100) / 100,
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (colNumber === 3 || colNumber === 5) {
          cell.alignment = { horizontal: 'center' };
        } else if (colNumber === 4) {
          cell.numFmt = '"$"#,##0.00';
          cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 6) {
          cell.numFmt = '0.00';
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    const totalQuantity = sortedProducts.reduce(
      (sum, p) => sum + p.totalQuantity,
      0,
    );
    const totalRevenue = sortedProducts.reduce(
      (sum, p) => sum + p.totalRevenue,
      0,
    );
    const totalOrders = sortedProducts.reduce(
      (sum, p) => sum + p.orderCount,
      0,
    );

    worksheet.addRow([]);
    const summaryRow = worksheet.addRow([
      'TOTALES',
      '',
      totalQuantity,
      totalRevenue,
      totalOrders,
      '',
    ]);

    summaryRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E7E6E6' },
      };
      cell.border = {
        top: { style: 'thick' },
        left: { style: 'thin' },
        bottom: { style: 'thick' },
        right: { style: 'thin' },
      };

      if (colNumber === 3 || colNumber === 5) {
        cell.alignment = { horizontal: 'center' };
      } else if (colNumber === 4) {
        cell.numFmt = '"$"#,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
    });

    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateUniqueDeliveryNumber(): Promise<number> {
    let tracking_number;
    let existOrder;

    do {
      const timestampPart = Date.now().toString().slice(-6);
      const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
      tracking_number = parseInt(timestampPart + randomPart, 10);

      existOrder = await this.invoiceRepository.findOne({
        where: { tracking_number },
      });
    } while (existOrder);

    return tracking_number;
  }

}
