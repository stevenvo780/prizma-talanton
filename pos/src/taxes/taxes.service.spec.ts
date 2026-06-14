import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaxesService } from './taxes.service';
import { Taxes, Operators } from './entities/taxes.entity';
import { User } from '../user/entities/user.entity';
import { CreateTaxesDto } from './dto/create-taxes.dto';
import { UpdateTaxesDto } from './dto/update-taxes.dto';

describe('TaxesService', () => {
  let service: TaxesService;

  const mockTaxesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
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

  const mockTaxes: Taxes = {
    id: 1,
    name: 'IVA',
    value: 19,
    operator: Operators.Percentage,
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxesService,
        {
          provide: getRepositoryToken(Taxes),
          useValue: mockTaxesRepository,
        },
      ],
    }).compile();

    service = module.get<TaxesService>(TaxesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tax', async () => {
      const createTaxesDto: CreateTaxesDto = {
        name: 'IVA',
        value: 19,
        operator: Operators.Percentage,
      };

      mockTaxesRepository.create.mockReturnValue(mockTaxes);
      mockTaxesRepository.save.mockResolvedValue(mockTaxes);

      const result = await service.create(createTaxesDto, mockUser);

      expect(mockTaxesRepository.create).toHaveBeenCalledWith(createTaxesDto);
      expect(mockTaxesRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTaxes);
    });
  });

  describe('findAll', () => {
    it('should return all taxes for a user', async () => {
      const userId = 'user-1';
      const expectedTaxes = [mockTaxes];

      mockTaxesRepository.find.mockResolvedValue(expectedTaxes);

      const result = await service.findAll(userId);

      expect(mockTaxesRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
      });
      expect(result).toEqual(expectedTaxes);
    });
  });

  describe('findOne', () => {
    it('should return a tax by id and userId', async () => {
      const taxId = 1;
      const userId = 'user-1';

      mockTaxesRepository.findOne.mockResolvedValue(mockTaxes);

      const result = await service.findOne(taxId, userId);

      expect(mockTaxesRepository.findOne).toHaveBeenCalledWith({
        where: { id: taxId, user: { id: userId } },
      });
      expect(result).toEqual(mockTaxes);
    });
  });

  describe('update', () => {
    it('should update a tax successfully', async () => {
      const taxId = 1;
      const updateTaxesDto: UpdateTaxesDto = {
        name: 'Updated Tax',
        value: 21,
        operator: Operators.Subtraction,
      };

      const updatedTaxes = { ...mockTaxes, ...updateTaxesDto };

      mockTaxesRepository.findOne.mockResolvedValue(mockTaxes);
      mockTaxesRepository.save.mockResolvedValue(updatedTaxes);

      const result = await service.update(taxId, updateTaxesDto);

      expect(mockTaxesRepository.findOne).toHaveBeenCalledWith({
        where: { id: taxId },
      });
      expect(mockTaxesRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedTaxes);
    });
  });

  describe('remove', () => {
    it('should delete a tax', async () => {
      const taxId = 1;
      const deleteResult = { affected: 1, raw: [] };

      mockTaxesRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.remove(taxId);

      expect(mockTaxesRepository.delete).toHaveBeenCalledWith(taxId);
      expect(result).toEqual(deleteResult);
    });
  });
});
