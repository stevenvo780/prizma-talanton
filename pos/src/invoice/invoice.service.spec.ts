import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceService } from './invoice.service';
import { Invoice, PaymentStatus, PaymentType } from './entities/invoice.entity';
import { Product } from '../product/entities/product.entity';
import { Client } from '../client/entities/client.entity';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '../config/config.service';
import { CashBoxService } from '../cash-box/cash-box.service';
import { MeraVueltaService } from '../meravuelta/meravuelta.service';
import { MailjetService } from '../mailjet/mailjet.service';
import { EventBusService } from '../shared/event-bus.service';
import { HubCentralService } from '../hubcentral/hubcentral.service';
import { OlympoHubService } from '../cauce/hub.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let clientRepository: jest.Mocked<Repository<Client>>;
  let configService: jest.Mocked<ConfigService>;
  let cashBoxService: jest.Mocked<CashBoxService>;
  let meravueltaService: jest.Mocked<MeraVueltaService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'password',
    auth_token: 'token',
    apiKey: null,
    profile: null,
    categories: [],
    products: [],
    clients: [],
    invoices: [],
    discounts: [],
    taxes: [],
    cashBoxes: [],
  };

  const mockInvoice: Invoice = {
    id: 1,
    date: new Date(),
    consecutive: 1,
    tracking_number: 123456789,
    totalAmount: 100.0,
    client: {
      id: 'client-1',
      name: 'Test Client',
      surname: 'Test Surname',
      email: 'client@test.com',
      phone: '123456789',
      address: 'Test Address',
      documentNumber: '12345678',
      typeDocument: null,
      user: mockUser,
      invoices: [],
    },
    invoiceItems: [],
    paymentType: PaymentType.CashOnDelivery,
    paymentStatus: PaymentStatus.Paid,
    user: mockUser,
  };

  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    sortName: 'test-product',
    description: 'Test Description',
    image: '',
    priceTypes: [
      {
        id: 1,
        sku: 'SKU001',
        price: 50.0,
        category: null,
        discounts: [],
        taxes: [],
        user: mockUser,
      },
    ],
    user: mockUser,
    categories: [],
    state: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              getMany: jest.fn(),
            })),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
            config: jest.fn(),
          },
        },
        {
          provide: CashBoxService,
          useValue: {
            cashIn: jest.fn(),
          },
        },
        {
          provide: MeraVueltaService,
          useValue: {
            createInvoiceFromInvoice: jest.fn(),
          },
        },
        {
          provide: MailjetService,
          useValue: {
            sendInvoiceEmail: jest.fn(),
          },
        },
        {
          provide: EventBusService,
          useValue: {
            publishInvoiceCreated: jest.fn(),
            publishInvoiceUpdated: jest.fn(),
            publishPaymentCompleted: jest.fn(),
          },
        },
        {
          provide: HubCentralService,
          useValue: {
            sendVentaPOSCreada: jest.fn(),
          },
        },
        {
          provide: OlympoHubService,
          useValue: {
            publish: jest.fn().mockResolvedValue(true),
            publishPosSaleCreated: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    productRepository = module.get(getRepositoryToken(Product));
    clientRepository = module.get(getRepositoryToken(Client));
    configService = module.get(ConfigService);
    cashBoxService = module.get(CashBoxService);
    meravueltaService = module.get(MeraVueltaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of invoices for a user', async () => {
      const userId = 'user-1';
      const mockInvoices = [mockInvoice];

      invoiceRepository.find.mockResolvedValue(mockInvoices);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockInvoices);
      expect(invoiceRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['client'],
        order: { id: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single invoice by id and userId', async () => {
      const invoiceId = 1;
      const userId = 'user-1';

      invoiceRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findOne(invoiceId, userId);

      expect(result).toEqual(mockInvoice);
      expect(invoiceRepository.findOne).toHaveBeenCalledWith({
        where: { id: invoiceId, user: { id: userId } },
        relations: ['client'],
      });
    });

    it('should return null when invoice not found', async () => {
      const invoiceId = 999;
      const userId = 'user-1';

      invoiceRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(invoiceId, userId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new invoice successfully', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        totalAmount: 100.0,
        iva: 10.0,
        withholdingTax: 0,
        client: {
          id: 'client-1',
          name: 'Test Client',
          surname: 'Test Surname',
          email: 'client@test.com',
          phone: '123456789',
          address: 'Test Address',
          documentNumber: '12345678',
          typeDocument: null,
          user: mockUser,
          invoices: [],
        },
        invoiceItems: [
          {
            sku: 'SKU001',
            quantity: 2,
            productPriceTypeId: 1,
            product: 1,
            price: 50.0,
            productName: 'Test Product',
            totalTax: 0,
            totalDiscount: 0,
          },
        ],
        paymentType: PaymentType.CashOnDelivery,
        paymentStatus: PaymentStatus.Paid,
        tracking_number: 123456789,
        date: new Date(),
        consecutive: 1,
      };

      const mockConfig = {
        id: 1,
        currentConsecutive: 0,
        initialConsecutive: 1,
        finalConsecutive: 1000,
        pluginsConfig: {
          graf: { auth_token: '' as const, enabled: false },
          meravuelta: { auth_token: '' as const, enabled: false },
          fiar: { auth_token: '' as const, enabled: false },
        },
        user: mockUser,
      } as any;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockProduct),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      invoiceRepository.findOne.mockResolvedValue(null);
      (productRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );
      clientRepository.findOne.mockResolvedValue(mockInvoice.client);
      configService.get.mockResolvedValue(mockConfig);
      configService.config.mockResolvedValue(undefined);
      invoiceRepository.save.mockResolvedValue(mockInvoice);
      cashBoxService.cashIn.mockResolvedValue(undefined);
      meravueltaService.createInvoiceFromInvoice.mockResolvedValue(undefined);

      const result = await service.create(createInvoiceDto, mockUser, 1);

      expect(result).toEqual(mockInvoice);
      expect(invoiceRepository.save).toHaveBeenCalled();
      expect(cashBoxService.cashIn).toHaveBeenCalledWith(1, 100.0);
    });
  });
});
