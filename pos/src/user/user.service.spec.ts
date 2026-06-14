import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password',
      };

      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(userRepository.save).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [mockUser];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(userRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['profile'],
      });
    });

    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['profile'],
      });
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found on update', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.update('non-existent', { name: 'X' })).rejects.toThrow(
        'Usuario con ID "non-existent" no encontrado.',
      );
    });

    it('should throw ConflictException when email already in use by another user', async () => {
      const existingOther = { ...mockUser, id: 'other-user', email: 'other@test.com' };
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)       // findOne for current user
        .mockResolvedValueOnce(existingOther); // findOneByEmail for conflict check

      await expect(service.update('user-1', { email: 'other@test.com' })).rejects.toThrow(
        'El correo electrónico "other@test.com" ya está en uso.',
      );
    });

    it('should allow updating email to same email', async () => {
      const updatedUser = { ...mockUser };
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)  // findOne current user
        .mockResolvedValueOnce(mockUser); // findOneByEmail returns same user
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', { email: 'test@example.com' });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const deleteResult = { affected: 1, raw: {} };

      userRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.remove('user-1');

      expect(result).toEqual(deleteResult);
      expect(userRepository.delete).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findByAuthToken', () => {
    it('should return a user by auth token', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByAuthToken('token');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { auth_token: 'token' },
        relations: ['profile'],
      });
    });
  });

  describe('findMe', () => {
    it('should return the authenticated user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findMe('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.findMe('non-existent')).rejects.toThrow(
        'Usuario con ID "non-existent" no encontrado.',
      );
    });
  });
});
