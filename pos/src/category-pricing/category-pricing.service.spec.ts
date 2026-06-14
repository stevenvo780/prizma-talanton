import { Test, TestingModule } from '@nestjs/testing';
import { CategoryPricingService } from './category-pricing.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryPricing } from './entities/category-pricing.entity';
import { User } from '../user/entities/user.entity';
import { CreateCategoryPricingDto } from './dto/create-category-pricing.dto';
import { UpdateCategoryPricingDto } from './dto/update-category-pricing.dto';

describe('CategoryPricingService', () => {
  let service: CategoryPricingService;

  const mockCategoryPricingRepository = {
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

  const mockCategoryPricing: CategoryPricing = {
    id: 1,
    name: 'Premium Pricing',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryPricingService,
        {
          provide: getRepositoryToken(CategoryPricing),
          useValue: mockCategoryPricingRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryPricingService>(CategoryPricingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category pricing', async () => {
      const createCategoryPricingDto: CreateCategoryPricingDto = {
        name: 'Premium Pricing',
      };

      mockCategoryPricingRepository.create.mockReturnValue(mockCategoryPricing);
      mockCategoryPricingRepository.save.mockResolvedValue(mockCategoryPricing);

      const result = await service.create(createCategoryPricingDto, mockUser);

      expect(mockCategoryPricingRepository.create).toHaveBeenCalledWith(
        createCategoryPricingDto,
      );
      expect(mockCategoryPricingRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCategoryPricing);
    });
  });

  describe('findAll', () => {
    it('should return all category pricings for a user', async () => {
      const userId = 'user-1';
      const expectedCategoryPricings = [mockCategoryPricing];

      mockCategoryPricingRepository.find.mockResolvedValue(
        expectedCategoryPricings,
      );

      const result = await service.findAll(userId);

      expect(mockCategoryPricingRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
      });
      expect(result).toEqual(expectedCategoryPricings);
    });
  });

  describe('findOne', () => {
    it('should return a category pricing by id and userId', async () => {
      const categoryPricingId = 1;
      const userId = 'user-1';

      mockCategoryPricingRepository.findOne.mockResolvedValue(
        mockCategoryPricing,
      );

      const result = await service.findOne(categoryPricingId, userId);

      expect(mockCategoryPricingRepository.findOne).toHaveBeenCalledWith({
        where: { id: categoryPricingId, user: { id: userId } },
      });
      expect(result).toEqual(mockCategoryPricing);
    });
  });

  describe('update', () => {
    it('should update a category pricing successfully', async () => {
      const categoryPricingId = 1;
      const updateCategoryPricingDto: UpdateCategoryPricingDto = {
        name: 'Updated Premium Pricing',
      };

      const updatedCategoryPricing = {
        ...mockCategoryPricing,
        ...updateCategoryPricingDto,
      };

      mockCategoryPricingRepository.findOne.mockResolvedValue(
        mockCategoryPricing,
      );
      mockCategoryPricingRepository.save.mockResolvedValue(
        updatedCategoryPricing,
      );

      const result = await service.update(
        categoryPricingId,
        updateCategoryPricingDto,
      );

      expect(mockCategoryPricingRepository.findOne).toHaveBeenCalledWith({
        where: { id: categoryPricingId },
      });
      expect(mockCategoryPricingRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedCategoryPricing);
    });
  });

  describe('remove', () => {
    it('should delete a category pricing', async () => {
      const categoryPricingId = 1;
      const deleteResult = { affected: 1, raw: [] };

      mockCategoryPricingRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.remove(categoryPricingId);

      expect(mockCategoryPricingRepository.delete).toHaveBeenCalledWith(
        categoryPricingId,
      );
      expect(result).toEqual(deleteResult);
    });
  });
});
