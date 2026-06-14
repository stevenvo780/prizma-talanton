import { Test, TestingModule } from '@nestjs/testing';
import { MeraVueltaService } from './meravuelta.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import {
  Invoice,
  PaymentType,
  PaymentStatus,
} from '../invoice/entities/invoice.entity';
import { ConfigService } from '../config/config.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MeraVueltaService', () => {
  let service: MeraVueltaService;

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockInvoiceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeraVueltaService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MeraVueltaService>(MeraVueltaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInvoiceFromInvoice', () => {
    it('should process invoice successfully', async () => {
      const mockInvoice: Invoice = {
        id: 1,
        totalAmount: 100,
        date: new Date(),
        consecutive: 1,
        tracking_number: 123456789,
        invoiceItems: [],
        paymentType: PaymentType.CashOnDelivery,
        paymentStatus: PaymentStatus.Paid,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          password: 'password',
          auth_token: 'token',
          apiKey: null,
          profile: {
            id: 1,
            phone: '123456789',
            companyName: 'Test Company',
            user: null,
            pluginsConfig: {
              total_pedido: { auth_token_total_pedido: '', enabled: false },
              meravuelta: { auth_token_meravuelta: 'test-key', enabled: true },
            },
            nit: null,
            dianConfig: null,
          } as unknown as any,
          products: [],
          invoices: [],
          clients: [],
          categories: [],
          cashBoxes: [],
          taxes: [],
          discounts: [],
        },
        client: {
          id: 'client-1',
          name: 'Test Client',
          surname: 'Test Surname',
          email: 'client@test.com',
          phone: '123456789',
          address: 'Test Address',
          documentNumber: '12345678',
          typeDocument: null,
          user: null,
          invoices: [],
        },
      };

      mockInvoiceRepository.findOne.mockResolvedValue(mockInvoice);
      mockConfigService.get.mockResolvedValue({
        pluginsConfig: { meravuelta: { enabled: true, auth_token: 'tok' } },
      });
      mockedAxios.post.mockResolvedValue({ data: { success: true, transactionId: 'TXN123' } });

      const result = await service.createInvoiceFromInvoice(1);

      expect(mockInvoiceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user', 'client'],
      });
      expect(result).toBeDefined();
    });

    it('should throw error when invoice not found', async () => {
      mockInvoiceRepository.findOne.mockResolvedValue(null);
      await expect(service.createInvoiceFromInvoice(1)).rejects.toThrow('Pedido no encontrado');
    });

    it('should return undefined when meravuelta plugin is disabled', async () => {
      const invoiceWithDisabledPlugin: Partial<Invoice> = {
        id: 2,
        user: {
          id: 'user-2',
          email: 'u@test.com',
          name: 'U',
          password: 'p',
          auth_token: 't',
          apiKey: null,
          profile: null,
          products: [], invoices: [], clients: [], categories: [], cashBoxes: [], taxes: [], discounts: [],
        } as User,
        client: null,
      };

      mockInvoiceRepository.findOne.mockResolvedValue(invoiceWithDisabledPlugin);
      mockConfigService.get.mockResolvedValue({
        pluginsConfig: { meravuelta: { enabled: false, auth_token: '' } },
      });

      const result = await service.createInvoiceFromInvoice(2);
      expect(result).toBeUndefined();
    });
  });
});
