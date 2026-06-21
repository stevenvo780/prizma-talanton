import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { NousConnectorController } from './nous-connector.controller';
import { NousConnectorService } from './nous-connector.service';
import { Invoice, PaymentStatus, PaymentType } from '../invoice/entities/invoice.entity';

describe('NousConnectorController', () => {
  let controller: NousConnectorController;
  let service: jest.Mocked<NousConnectorService>;

  const mockInvoice: Partial<Invoice> = {
    id: 42,
    tracking_number: 99001,
    totalAmount: 150000,
    paymentStatus: PaymentStatus.Unpaid,
    paymentType: PaymentType.AccountReceivable,
    date: new Date('2026-06-19T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NousConnectorController],
      providers: [
        {
          provide: NousConnectorService,
          useValue: {
            upsertPendingApproval: jest.fn(),
            upsertInventorySync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NousConnectorController>(NousConnectorController);
    service = module.get(NousConnectorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── receivePendingApproval ───────────────────────────────────────────────

  describe('receivePendingApproval', () => {
    it('llama a upsertPendingApproval con el payload y devuelve invoiceId', async () => {
      service.upsertPendingApproval.mockResolvedValue(mockInvoice as Invoice);

      const payload = {
        orderId: '99001',
        customer: { name: 'Juan Pérez', phone: '3001234567' },
        total: 150000,
        items: [{ sku: 'PROD-01', quantity: 2, price: 75000, name: 'Camiseta' }],
        currency: 'COP',
      };

      const result = await controller.receivePendingApproval(payload);

      expect(service.upsertPendingApproval).toHaveBeenCalledTimes(1);
      expect(service.upsertPendingApproval).toHaveBeenCalledWith(payload);
      expect(result.success).toBe(true);
      expect(result.invoiceId).toBe(42);
      expect(result.orderId).toBe('99001');
      expect(result.timestamp).toBeDefined();
    });

    it('NO devuelve success:true si el service lanza error (propaga excepción)', async () => {
      service.upsertPendingApproval.mockRejectedValue(
        new InternalServerErrorException('Error al persistir'),
      );

      await expect(
        controller.receivePendingApproval({ orderId: 'fail-123', total: 0 }),
      ).rejects.toThrow(InternalServerErrorException);

      expect(service.upsertPendingApproval).toHaveBeenCalledTimes(1);
    });

    it('pasa orderId undefined si no viene en payload', async () => {
      service.upsertPendingApproval.mockResolvedValue(mockInvoice as Invoice);

      const result = await controller.receivePendingApproval({ total: 5000 });

      expect(result.orderId).toBe('unknown');
    });
  });

  // ─── receiveInventorySync ─────────────────────────────────────────────────

  describe('receiveInventorySync', () => {
    it('llama a upsertInventorySync con el payload y devuelve resumen', async () => {
      service.upsertInventorySync.mockResolvedValue({
        updated: 2,
        skipped: 1,
        details: ['sku=A1: actualizado', 'sku=B2: actualizado', 'sin-sku: omitido'],
      });

      const payload = {
        items: [
          { sku: 'A1', qty: 10 },
          { sku: 'B2', quantity: 5 },
          { qty: 3 }, // sin sku → skipped
        ],
      };

      const result = await controller.receiveInventorySync(payload);

      expect(service.upsertInventorySync).toHaveBeenCalledTimes(1);
      expect(service.upsertInventorySync).toHaveBeenCalledWith(payload);
      expect(result.success).toBe(true);
      expect(result.itemsReceived).toBe(3);
      expect(result.itemsUpdated).toBe(2);
      expect(result.itemsSkipped).toBe(1);
      expect(result.details).toHaveLength(3);
      expect(result.timestamp).toBeDefined();
    });

    it('NO devuelve success:true si el service lanza error (propaga excepción)', async () => {
      service.upsertInventorySync.mockRejectedValue(
        new InternalServerErrorException('Error al sincronizar inventario para sku=X'),
      );

      await expect(
        controller.receiveInventorySync({ items: [{ sku: 'X', qty: 5 }] }),
      ).rejects.toThrow(InternalServerErrorException);

      expect(service.upsertInventorySync).toHaveBeenCalledTimes(1);
    });

    it('maneja payload sin items (array vacío)', async () => {
      service.upsertInventorySync.mockResolvedValue({
        updated: 0,
        skipped: 0,
        details: [],
      });

      const result = await controller.receiveInventorySync({});

      expect(result.itemsReceived).toBe(0);
      expect(result.itemsUpdated).toBe(0);
      expect(result.success).toBe(true);
    });
  });
});
