import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileService } from './profile.service';
import { Profile } from './entities/profile.entity';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepository: jest.Mocked<Repository<Profile>>;
  let userService: jest.Mocked<UserService>;

  const mockProfileRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    profileRepository = module.get(getRepositoryToken(Profile));
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a profile successfully', async () => {
      const createProfileDto: CreateProfileDto = {
        phone: '1234567890',
        companyName: 'Test Company',
        userId: 'user-1',
        nit: '900123456',
        legalAddress: 'Calle 123 #45-67',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'John',
        password: 'password',
        auth_token: 'token',
        apiKey: null,
      } as User;

      const mockProfile = {
        id: 1,
        phone: '1234567890',
        companyName: 'Test Company',
        nit: '900123456',
        dianConfig: null,
        user: mockUser,
        pluginsConfig: {
          total_pedido: { auth_token_total_pedido: '', enabled: false },
          talaria: { auth_token_talaria: '', enabled: false },
        },
      } as unknown as Profile;

      mockUserService.findOne.mockResolvedValue(mockUser);
      mockProfileRepository.create.mockReturnValue(mockProfile);
      mockProfileRepository.save.mockResolvedValue(mockProfile);

      const result = await service.create(createProfileDto);

      expect(mockUserService.findOne).toHaveBeenCalledWith('user-1');
      expect(mockProfileRepository.create).toHaveBeenCalledWith({
        ...createProfileDto,
        user: mockUser,
      });
      expect(mockProfileRepository.save).toHaveBeenCalledWith(mockProfile);
      expect(result).toEqual(mockProfile);
    });

    it('should throw error when user not found', async () => {
      const createProfileDto: CreateProfileDto = {
        phone: '1234567890',
        companyName: 'Test Company',
        userId: 'user-1',
        nit: '900123456',
        legalAddress: 'Calle 123',
      };

      mockUserService.findOne.mockResolvedValue(null);

      await expect(service.create(createProfileDto)).rejects.toThrow(
        'Usuario no encontrado',
      );
    });
  });

  describe('findAll', () => {
    it('should return all profiles', async () => {
      const mockProfiles = [
        {
          id: 1,
          phone: '1234567890',
          companyName: 'Test Company',
          nit: '900123456',
          dianConfig: null,
        },
      ] as unknown as Profile[];

      mockProfileRepository.find.mockResolvedValue(mockProfiles);

      const result = await service.findAll();

      expect(mockProfileRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockProfiles);
    });
  });

  describe('findOne', () => {
    it('should return a profile by id', async () => {
      const mockProfile = {
        id: 1,
        phone: '1234567890',
        companyName: 'Test Company',
        nit: '900123456',
        dianConfig: null,
      } as unknown as Profile;

      mockProfileRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.findOne(1);

      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(result).toEqual(mockProfile);
    });
  });

  describe('update', () => {
    it('should update a profile successfully', async () => {
      const updateProfileDto: UpdateProfileDto = {
        phone: '0987654321',
      };

      const existingProfile = {
        id: 1,
        phone: '1234567890',
        companyName: 'Test Company',
        nit: '900123456',
        dianConfig: null,
      } as unknown as Profile;

      const updatedProfile = {
        ...existingProfile,
        ...updateProfileDto,
      } as unknown as Profile;

      mockProfileRepository.findOne.mockResolvedValue(existingProfile);
      mockProfileRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.update(1, updateProfileDto);

      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...existingProfile,
          ...updateProfileDto,
        }),
      );
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('remove', () => {
    it('should remove a profile successfully', async () => {
      const deleteResult = { affected: 1 };
      mockProfileRepository.delete.mockResolvedValue(deleteResult as any);

      const result = await service.remove(1);

      expect(mockProfileRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(deleteResult);
    });
  });
});
