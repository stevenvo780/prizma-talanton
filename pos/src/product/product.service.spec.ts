import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { User } from '../user/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: jest.Mocked<Repository<Product>>;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;

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
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            createQueryBuilder: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get(getRepositoryToken(Product));
    invoiceRepository = module.get(getRepositoryToken(Invoice));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByQuery', () => {
    it('should return all products when query is empty', async () => {
      const mockProducts = [mockProduct];
      productRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findByQuery('', 'user-1');

      expect(result).toEqual(mockProducts);
      expect(productRepository.find).toHaveBeenCalledWith({});
    });

    it('should return filtered products when query is provided', async () => {
      const mockProducts = [mockProduct];
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProducts),
      };

      productRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findByQuery('test', 'user-1');

      expect(result).toEqual(mockProducts);
      expect(productRepository.createQueryBuilder).toHaveBeenCalledWith(
        'product',
      );
    });
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const createProductDto: CreateProductDto = {
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
        categories: [],
      };

      productRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto, mockUser);

      expect(result).toEqual(mockProduct);
      expect(productRepository.save).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search products with filters', async () => {
      const mockProducts = [mockProduct];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProducts),
      };

      productRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const query = {
        categoryId: 1,
        name: 'test',
        priceTypeId: 1,
      };

      await service.search(query, 'user-1');

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'product.categories',
        'category',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.user.id = :userId',
        { userId: 'user-1' },
      );
    });
  });
});
