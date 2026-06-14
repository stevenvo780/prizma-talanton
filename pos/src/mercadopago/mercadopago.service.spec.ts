import { Test, TestingModule } from '@nestjs/testing';
import { MercadoPagoService } from './mercadopago.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentSource } from './entities/payment-source.entity';
import { Subscription } from '../user/entities/subscription.entity';
import { UserService } from '../user/user.service';

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    process.env.MP_ACCESS_TOKEN = 'TEST-token';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoPagoService,
        {
          provide: getRepositoryToken(PaymentSource),
          useValue: { ...mockRepository },
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: { ...mockRepository },
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<MercadoPagoService>(MercadoPagoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
