import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { User } from '../user/entities/user.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: jest.Mocked<Repository<Category>>;

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

  const mockCategory: Category = {
    id: 1,
    name: 'Test Category',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'Test Category',
      };

      categoryRepository.create.mockReturnValue(mockCategory);
      categoryRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(createCategoryDto, mockUser);

      expect(result).toEqual(mockCategory);
      expect(categoryRepository.create).toHaveBeenCalledWith(createCategoryDto);
      expect(categoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of categories for a user', async () => {
      const mockCategories = [mockCategory];
      categoryRepository.find.mockResolvedValue(mockCategories);

      const result = await service.findAll('user-1');

      expect(result).toEqual(mockCategories);
      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id and userId', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(1, 'user-1');

      expect(result).toEqual(mockCategory);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user: { id: 'user-1' } },
      });
    });

    it('should return null when category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999, 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.save.mockResolvedValue({
        ...mockCategory,
        ...updateCategoryDto,
      });

      const result = await service.update(1, updateCategoryDto);

      expect(result.name).toBe('Updated Category');
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(categoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const deleteResult = { affected: 1, raw: {} };
      categoryRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.remove(1);

      expect(result).toEqual(deleteResult);
      expect(categoryRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
