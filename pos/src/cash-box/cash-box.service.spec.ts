import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CashBoxService } from './cash-box.service';
import { CashBox } from './entities/cash-box.entity';
import { User } from '../user/entities/user.entity';
import { CreateCashBoxDto } from './dto/create-cash-box.dto';
import { UpdateCashBoxDto } from './dto/update-cash-box.dto';

describe('CashBoxService', () => {
  let service: CashBoxService;

  const mockCashBoxRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'password',
    auth_token: 'token',
    apiKey: null,
    profile: null,
    products: [],
    invoices: [],
    clients: [],
    categories: [],
    cashBoxes: [],
    taxes: [],
    discounts: [],
  };

  const mockCashBox: CashBox = {
    id: 1,
    cashIn: 1000,
    cashOut: 200,
    balance: 800,
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashBoxService,
        {
          provide: getRepositoryToken(CashBox),
          useValue: mockCashBoxRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<CashBoxService>(CashBoxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new cash box', async () => {
      const createCashBoxDto: CreateCashBoxDto = {
        cashIn: 1000,
        cashOut: 0,
        balance: 1000,
        user: mockUser,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockCashBoxRepository.create.mockReturnValue(mockCashBox);
      mockCashBoxRepository.save.mockResolvedValue(mockCashBox);

      const result = await service.create(createCashBoxDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockCashBoxRepository.create).toHaveBeenCalledWith({
        ...createCashBoxDto,
        user: mockUser,
      });
      expect(mockCashBoxRepository.save).toHaveBeenCalledWith(mockCashBox);
      expect(result).toEqual(mockCashBox);
    });
  });

  describe('findAll', () => {
    it('should return all cash boxes for a user', async () => {
      const userId = 'user-1';
      const expectedCashBoxes = [mockCashBox];

      mockCashBoxRepository.find.mockResolvedValue(expectedCashBoxes);

      const result = await service.findAll(userId);

      expect(mockCashBoxRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      expect(result).toEqual(expectedCashBoxes);
    });
  });

  describe('findOne', () => {
    it('should return a cash box by id and userId', async () => {
      const cashBoxId = 1;
      const userId = 'user-1';

      mockCashBoxRepository.findOne.mockResolvedValue(mockCashBox);

      const result = await service.findOne(cashBoxId, userId);

      expect(mockCashBoxRepository.findOne).toHaveBeenCalledWith({
        where: { id: cashBoxId, user: { id: userId } },
        relations: ['user'],
      });
      expect(result).toEqual(mockCashBox);
    });
  });

  describe('update', () => {
    it('should update a cash box successfully', async () => {
      const cashBoxId = 1;
      const updateCashBoxDto: UpdateCashBoxDto = {
        balance: 1500,
      };

      const updatedCashBox = { ...mockCashBox, ...updateCashBoxDto };

      mockCashBoxRepository.findOne.mockResolvedValue(mockCashBox);
      mockCashBoxRepository.save.mockResolvedValue(updatedCashBox);

      const result = await service.update(cashBoxId, updateCashBoxDto);

      expect(mockCashBoxRepository.findOne).toHaveBeenCalledWith({
        where: { id: cashBoxId },
      });
      expect(mockCashBoxRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedCashBox);
    });
  });

  describe('remove', () => {
    it('should delete a cash box', async () => {
      const cashBoxId = 1;
      const deleteResult = { affected: 1, raw: [] };

      mockCashBoxRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.remove(cashBoxId);

      expect(mockCashBoxRepository.delete).toHaveBeenCalledWith(cashBoxId);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('cashIn', () => {
    it('should increase cash in and balance', async () => {
      const cashBoxId = 1;
      const amount = 500;

      // Crear un objeto mutable que será modificado por el servicio
      const mutableCashBox = {
        id: 1,
        cashIn: 1000,
        cashOut: 200,
        balance: 800,
        user: mockUser,
      };

      mockCashBoxRepository.findOne.mockResolvedValue(mutableCashBox);

      // El mock de save debe retornar el objeto modificado
      mockCashBoxRepository.save.mockImplementation(async (cashBox) => {
        return cashBox; // Retorna el mismo objeto que fue modificado
      });

      const result = await service.cashIn(cashBoxId, amount);

      expect(mockCashBoxRepository.findOne).toHaveBeenCalledWith({
        where: { id: cashBoxId },
      });
      expect(mockCashBoxRepository.save).toHaveBeenCalled();
      expect(result.cashIn).toBe(1500); // 1000 + 500
      expect(result.balance).toBe(1300); // 800 + 500
    });
  });

  describe('cashOut', () => {
    it('should decrease cash out and balance when sufficient funds', async () => {
      const cashBoxId = 1;
      const amount = 300;

      // Crear un objeto mutable que será modificado por el servicio
      const mutableCashBox = {
        id: 1,
        cashIn: 1000,
        cashOut: 200,
        balance: 800,
        user: mockUser,
      };

      mockCashBoxRepository.findOne.mockResolvedValue(mutableCashBox);

      // El mock de save debe retornar el objeto modificado
      mockCashBoxRepository.save.mockImplementation(async (cashBox) => {
        return cashBox; // Retorna el mismo objeto que fue modificado
      });

      const result = await service.cashOut(cashBoxId, amount);

      expect(mockCashBoxRepository.findOne).toHaveBeenCalledWith({
        where: { id: cashBoxId },
      });
      expect(mockCashBoxRepository.save).toHaveBeenCalled();
      expect(result.cashOut).toBe(500); // 200 + 300
      expect(result.balance).toBe(500); // 800 - 300
    });

    it('should throw error when insufficient balance', async () => {
      const cashBoxId = 1;
      const amount = 1000; // More than current balance (800)

      // Crear un objeto mutable
      const mutableCashBox = {
        id: 1,
        cashIn: 1000,
        cashOut: 200,
        balance: 800,
        user: mockUser,
      };

      mockCashBoxRepository.findOne.mockResolvedValue(mutableCashBox);

      await expect(service.cashOut(cashBoxId, amount)).rejects.toThrow(
        'Insufficient balance in the cash box',
      );

      expect(mockCashBoxRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('adjustBalance', () => {
    it('should adjust balance to new amount', async () => {
      const cashBoxId = 1;
      const newBalance = 2000;
      const adjustedCashBox = { ...mockCashBox, balance: newBalance };

      mockCashBoxRepository.findOne.mockResolvedValue(mockCashBox);
      mockCashBoxRepository.save.mockResolvedValue(adjustedCashBox);

      const result = await service.adjustBalance(cashBoxId, newBalance);

      expect(mockCashBoxRepository.findOne).toHaveBeenCalledWith({ where: { id: cashBoxId } });
      expect(mockCashBoxRepository.save).toHaveBeenCalled();
      expect(result.balance).toBe(newBalance);
    });

    it('should throw when cash box not found on adjustBalance', async () => {
      mockCashBoxRepository.findOne.mockResolvedValue(null);
      await expect(service.adjustBalance(999, 500)).rejects.toThrow('Cash box not found');
    });
  });

  describe('cashIn by name (string identifier)', () => {
    it('should find by name when identifier is a string', async () => {
      const mutableCashBox = { id: 2, cashIn: 0, cashOut: 0, balance: 0, user: mockUser, name: 'Caja Norte' };
      mockCashBoxRepository.findOne.mockResolvedValue(mutableCashBox);
      mockCashBoxRepository.save.mockImplementation(async (cb) => cb);

      const result = await service.cashIn('Caja Norte', 200);

      expect(mockCashBoxRepository.findOne).toHaveBeenCalledWith({ where: { name: 'Caja Norte' } });
      expect(result.cashIn).toBe(200);
      expect(result.balance).toBe(200);
    });

    it('should create cash box when cashIn and not found', async () => {
      mockCashBoxRepository.findOne.mockResolvedValue(null);
      const newBox = { id: 3, cashIn: 0, cashOut: 0, balance: 0, user: null, name: 'Nueva' };
      mockCashBoxRepository.create.mockReturnValue(newBox);
      mockCashBoxRepository.save.mockImplementation(async (cb) => ({ ...cb }));

      const result = await service.cashIn('Nueva', 100);

      expect(mockCashBoxRepository.create).toHaveBeenCalled();
      expect(result.cashIn).toBe(100);
    });
  });

  describe('cashOut edge cases', () => {
    it('should throw when cash box not found on cashOut', async () => {
      mockCashBoxRepository.findOne.mockResolvedValue(null);
      await expect(service.cashOut(999, 100)).rejects.toThrow('Cash box not found');
    });

    it('should allow cashOut with exact balance amount', async () => {
      const exactBox = { id: 1, cashIn: 500, cashOut: 0, balance: 500, user: mockUser };
      mockCashBoxRepository.findOne.mockResolvedValue(exactBox);
      mockCashBoxRepository.save.mockImplementation(async (cb) => cb);

      const result = await service.cashOut(1, 500);
      expect(result.balance).toBe(0);
    });
  });
});
