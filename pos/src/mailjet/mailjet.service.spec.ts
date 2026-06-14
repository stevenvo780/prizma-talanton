import { Test, TestingModule } from '@nestjs/testing';
import { MailjetService } from './mailjet.service';
import { UserService } from '../user/user.service';
import {
  Invoice,
  PaymentStatus,
  PaymentType,
} from '../invoice/entities/invoice.entity';
import { Client, TypeDocument } from '../client/entities/client.entity';

jest.mock('node-mailjet', () => {
  const mockRequest = jest.fn().mockResolvedValue({
    response: { status: 200 },
  });

  const mockPost = jest.fn().mockReturnValue({
    request: mockRequest,
  });

  const mockInstance = {
    post: mockPost,
  };

  const apiConnect = jest.fn().mockReturnValue(mockInstance);

  return {
    __esModule: true,
    Client: { apiConnect },
    default: { apiConnect },
  };
});

describe('MailjetService', () => {
  let service: MailjetService;

  const mockUserService = {
    findMe: jest.fn().mockResolvedValue({
      email: process.env.MAILJET_FROM_EMAIL,
      profile: { companyName: process.env.MAILJET_FROM_NAME },
      name: 'Test',
    }),
  };

  beforeEach(async () => {
    process.env.MAILJET_API_KEY = 'test_api_key';
    process.env.MAILJET_API_SECRET = 'test_api_secret';
    process.env.MAILJET_FROM_EMAIL = 'test@example.com';
    process.env.MAILJET_FROM_NAME = 'Test Sistema POS';

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailjetService,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<MailjetService>(MailjetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return false when client has no email', async () => {
    const mockInvoice = {
      id: 1,
      consecutive: 1001,
      tracking_number: 123456789,
      totalAmount: 100000,
      date: new Date(),
      paymentStatus: PaymentStatus.Paid,
      paymentType: PaymentType.CashOnDelivery,
      invoiceItems: [
        {
          productName: 'Producto Test',
          quantity: 2,
          price: 50000,
          totalTax: 0,
          totalDiscount: 0,
        },
      ],
      user: { id: 'user1' } as any,
    } as Invoice;

    const mockClient = {
      id: '1',
      name: 'Juan',
      surname: 'Pérez',
      documentNumber: '12345678',
      phone: '1234567890',
      address: 'Calle 123',
      email: '',
      typeDocument: TypeDocument.CC,
      invoices: [],
      user: null,
    } as Client;

    const result = await service.sendInvoiceEmail(mockInvoice, mockClient);
    expect(result).toBe(false);
  });

  it('should send email successfully when client has email', async () => {
    const mockInvoice = {
      id: 1,
      consecutive: 1001,
      tracking_number: 123456789,
      totalAmount: 100000,
      date: new Date(),
      paymentStatus: PaymentStatus.Paid,
      paymentType: PaymentType.CashOnDelivery,
      invoiceItems: [
        {
          productName: 'Producto Test',
          quantity: 2,
          price: 50000,
          totalTax: 0,
          totalDiscount: 0,
        },
      ],
      user: { id: 'user1' } as any,
    } as Invoice;

    const mockClient = {
      id: '1',
      name: 'Juan',
      surname: 'Pérez',
      documentNumber: '12345678',
      phone: '1234567890',
      address: 'Calle 123',
      email: 'juan@example.com',
      typeDocument: TypeDocument.CC,
      invoices: [],
      user: null,
    } as Client;

    const result = await service.sendInvoiceEmail(mockInvoice, mockClient);
    expect(result).toBe(true);
  });

  it('should generate correct email template', () => {
    const mockInvoice = {
      id: 1,
      consecutive: 1001,
      tracking_number: 123456789,
      totalAmount: 100000,
      date: new Date('2024-01-15'),
      paymentStatus: PaymentStatus.Paid,
      paymentType: PaymentType.CashOnDelivery,
      invoiceItems: [
        {
          productName: 'Producto Test',
          quantity: 2,
          price: 50000,
          totalTax: 0,
          totalDiscount: 0,
        },
      ],
      user: { id: 'user1' } as any,
    } as Invoice;

    const mockClient = {
      id: '1',
      name: 'Juan',
      surname: 'Pérez',
      documentNumber: '12345678',
      phone: '1234567890',
      address: 'Calle 123',
      email: 'juan@example.com',
      typeDocument: TypeDocument.CC,
      invoices: [],
      user: null,
    } as Client;

    const templateMethod = (service as any).generateInvoiceEmailTemplate;
    const template = templateMethod(mockInvoice, mockClient, {});

    expect(template).toContain('FACTURA');
    expect(template).toContain('#1001');
    expect(template).toContain('Juan Pérez');
    expect(template).toContain('Producto Test');
    expect(template).toContain('$100.000');
  });

  it('should generate correct email text', () => {
    const mockInvoice = {
      id: 1,
      consecutive: 1001,
      tracking_number: 123456789,
      totalAmount: 100000,
      date: new Date('2024-01-15'),
      paymentStatus: PaymentStatus.Paid,
      paymentType: PaymentType.CashOnDelivery,
      invoiceItems: [
        {
          productName: 'Producto Test',
          quantity: 2,
          price: 50000,
          totalTax: 0,
          totalDiscount: 0,
        },
      ],
      user: { id: 'user1' } as any,
    } as Invoice;

    const mockClient = {
      id: '1',
      name: 'Juan',
      surname: 'Pérez',
      documentNumber: '12345678',
      phone: '1234567890',
      address: 'Calle 123',
      email: 'juan@example.com',
      typeDocument: TypeDocument.CC,
      invoices: [],
      user: null,
    } as Client;

    const textMethod = (service as any).generateInvoiceEmailText;
    const text = textMethod(mockInvoice, mockClient, {});

    expect(text).toContain('FACTURA #1001');
    expect(text).toContain('Juan Pérez');
    expect(text).toContain('Producto Test: 2 x');
    expect(text).toContain('TOTAL: $100.000');
  });

  it('should handle email sending errors gracefully', async () => {
    const mockInvoice = {
      id: 1,
      consecutive: 1001,
      tracking_number: 123456789,
      totalAmount: 100000,
      date: new Date(),
      paymentStatus: PaymentStatus.Paid,
      paymentType: PaymentType.CashOnDelivery,
      invoiceItems: [
        {
          productName: 'Producto Test',
          quantity: 2,
          price: 50000,
          totalTax: 0,
          totalDiscount: 0,
        },
      ],
      user: { id: 'user1' } as any,
    } as Invoice;

    const mockClient = {
      id: '1',
      name: 'Juan',
      surname: 'Pérez',
      documentNumber: '12345678',
      phone: '1234567890',
      address: 'Calle 123',
      email: 'juan@example.com',
      typeDocument: TypeDocument.CC,
      invoices: [],
      user: null,
    } as Client;

    const result = await service.sendInvoiceEmail(mockInvoice, mockClient);
    expect(result).toBe(true);
  });
});
