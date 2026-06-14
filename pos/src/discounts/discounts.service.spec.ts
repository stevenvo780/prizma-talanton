import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiscountsService } from './discounts.service';
import { Discounts, Operators } from './entities/discounts.entity';
import { User } from '../user/entities/user.entity';
import { CreateDiscountsDto } from './dto/create-discounts.dto';
import { UpdateDiscountsDto } from './dto/update-discounts.dto';

describe('DiscountsService', () => {
  let service: DiscountsService;

  const mockDiscountsRepository = {
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

  const mockDiscounts: Discounts = {
    id: 1,
    name: 'Holiday Discount',
    value: 10,
    operator: Operators.Percentage,
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        {
          provide: getRepositoryToken(Discounts),
          useValue: mockDiscountsRepository,
        },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new discount', async () => {
      const createDiscountsDto: CreateDiscountsDto = {
        name: 'Holiday Discount',
        value: 10,
        operator: Operators.Percentage,
      };

      mockDiscountsRepository.create.mockReturnValue(mockDiscounts);
      mockDiscountsRepository.save.mockResolvedValue(mockDiscounts);

      const result = await service.create(createDiscountsDto, mockUser);

      expect(mockDiscountsRepository.create).toHaveBeenCalledWith(
        createDiscountsDto,
      );
      expect(mockDiscountsRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockDiscounts);
    });
  });

  describe('findAll', () => {
    it('should return all discounts for a user', async () => {
      const userId = 'user-1';
      const expectedDiscounts = [mockDiscounts];

      mockDiscountsRepository.find.mockResolvedValue(expectedDiscounts);

      const result = await service.findAll(userId);

      expect(mockDiscountsRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
      });
      expect(result).toEqual(expectedDiscounts);
    });
  });

  describe('findOne', () => {
    it('should return a discount by id and userId', async () => {
      const discountId = 1;
      const userId = 'user-1';

      mockDiscountsRepository.findOne.mockResolvedValue(mockDiscounts);

      const result = await service.findOne(discountId, userId);

      expect(mockDiscountsRepository.findOne).toHaveBeenCalledWith({
        where: { id: discountId, user: { id: userId } },
      });
      expect(result).toEqual(mockDiscounts);
    });
  });

  describe('update', () => {
    it('should update a discount successfully', async () => {
      const discountId = 1;
      const updateDiscountsDto: UpdateDiscountsDto = {
        name: 'Updated Discount',
        value: 15,
      };

      const updatedDiscounts = { ...mockDiscounts, ...updateDiscountsDto };

      mockDiscountsRepository.findOne.mockResolvedValue(mockDiscounts);
      mockDiscountsRepository.save.mockResolvedValue(updatedDiscounts);

      const result = await service.update(discountId, updateDiscountsDto);

      expect(mockDiscountsRepository.findOne).toHaveBeenCalledWith({
        where: { id: discountId },
      });
      expect(mockDiscountsRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedDiscounts);
    });
  });

  describe('remove', () => {
    it('should delete a discount', async () => {
      const discountId = 1;
      const deleteResult = { affected: 1, raw: [] };

      mockDiscountsRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.remove(discountId);

      expect(mockDiscountsRepository.delete).toHaveBeenCalledWith(discountId);
      expect(result).toEqual(deleteResult);
    });
  });
});
