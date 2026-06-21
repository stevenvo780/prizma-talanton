import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from './config.service';
import { Config } from './entities/config.entity';
import { User } from '../user/entities/user.entity';
import { ProfileService } from '../profile/profile.service';
import { CreateConfigDto } from './dto/create-config.dto';

describe('ConfigService', () => {
  let service: ConfigService;

  const mockConfigRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockProfileService = { findByUserId: jest.fn() };

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

  const mockConfig: Config = {
    id: 1,
    initialConsecutive: 1000,
    finalConsecutive: 9999,
    currentConsecutive: 1005,
    pluginsConfig: {
      hermes: { auth_token: '', enabled: false },
      talaria: { auth_token: '', enabled: false },
      pistis: { auth_token: '', enabled: false },
    },
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: getRepositoryToken(Config),
          useValue: mockConfigRepository,
        },
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('config', () => {
    it('should create a new config when none exists', async () => {
      const createConfigDto: CreateConfigDto = {
        initialConsecutive: 2000,
        finalConsecutive: 9999,
        currentConsecutive: 2000,
      };

      mockConfigRepository.findOne.mockResolvedValue(null);
      mockConfigRepository.save.mockResolvedValue({
        ...mockConfig,
        ...createConfigDto,
      });

      const result = await service.config(createConfigDto, mockUser);

      expect(mockConfigRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } },
      });
      expect(mockConfigRepository.save).toHaveBeenCalled();
      expect(result.initialConsecutive).toBe(2000);
      expect(result.currentConsecutive).toBe(2000);
    });

    it('should update existing config', async () => {
      const createConfigDto: CreateConfigDto = {
        initialConsecutive: 1000,
        finalConsecutive: 8888,
        currentConsecutive: 1010,
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockConfigRepository.save.mockResolvedValue({
        ...mockConfig,
        ...createConfigDto,
      });

      const result = await service.config(createConfigDto, mockUser);

      expect(mockConfigRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } },
      });
      expect(mockConfigRepository.save).toHaveBeenCalled();
      expect(result.finalConsecutive).toBe(8888);
    });

    it('should reset currentConsecutive when initialConsecutive changes', async () => {
      const createConfigDto: CreateConfigDto = {
        initialConsecutive: 3000, // Different from existing (1000)
        finalConsecutive: 9999,
        currentConsecutive: 1500, // This should be overridden
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockConfigRepository.save.mockResolvedValue({
        ...mockConfig,
        initialConsecutive: 3000,
        currentConsecutive: 3000, // Should be reset to initialConsecutive
      });

      const result = await service.config(createConfigDto, mockUser);

      expect(result.currentConsecutive).toBe(3000);
      expect(result.initialConsecutive).toBe(3000);
    });

    it('should preserve currentConsecutive when initialConsecutive unchanged', async () => {
      const createConfigDto: CreateConfigDto = {
        initialConsecutive: 1000, // Same as existing
        finalConsecutive: 8888,
        currentConsecutive: 1010,
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockConfigRepository.save.mockResolvedValue({
        ...mockConfig,
        finalConsecutive: 8888,
        currentConsecutive: 1010,
      });

      const result = await service.config(createConfigDto, mockUser);

      expect(result.currentConsecutive).toBe(1010);
      expect(result.finalConsecutive).toBe(8888);
    });
  });

  describe('get', () => {
    it('should return existing config for user', async () => {
      const userId = 'user-1';

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);

      const result = await service.get(userId);

      expect(mockConfigRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId } },
      });
      expect(result).toEqual(mockConfig);
    });

    it('should return new config with defaults when none exists for user', async () => {
      const userId = 'user-1';
      const newConfigInstance = new Config();
      newConfigInstance.initialConsecutive = 1;
      newConfigInstance.finalConsecutive = 100;
      newConfigInstance.currentConsecutive = 1;

      mockConfigRepository.findOne.mockResolvedValue(null);
      mockProfileService.findByUserId.mockResolvedValue(null);
      mockConfigRepository.save.mockResolvedValue(newConfigInstance);

      const result = await service.get(userId);

      expect(mockConfigRepository.findOne).toHaveBeenCalledWith({ where: { user: { id: userId } } });
      expect(mockConfigRepository.save).toHaveBeenCalled();
      expect(result.initialConsecutive).toBe(1);
      expect(result.finalConsecutive).toBe(100);
      expect(result.currentConsecutive).toBe(1);
    });

    it('should attach user from profile when creating default config', async () => {
      const userId = 'user-1';
      const mockProfileWithUser = { id: 1, user: mockUser };
      const savedConfig = new Config();

      mockConfigRepository.findOne.mockResolvedValue(null);
      mockProfileService.findByUserId.mockResolvedValue(mockProfileWithUser as any);
      mockConfigRepository.save.mockResolvedValue(savedConfig);

      await service.get(userId);

      expect(mockProfileService.findByUserId).toHaveBeenCalledWith(userId);
      const saveCall = mockConfigRepository.save.mock.calls[0][0];
      expect(saveCall.user).toEqual(mockUser);
    });

    it('should handle repository errors gracefully', async () => {
      const userId = 'user-1';

      mockConfigRepository.findOne.mockRejectedValue(new Error('DB Error'));

      await expect(service.get(userId)).rejects.toThrow('DB Error');
    });
  });
});
