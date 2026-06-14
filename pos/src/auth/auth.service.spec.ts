import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { RegisterUserDto } from './dto/register.dto';

// Mock firebase admin
const mockFirebaseAuth = {
  createUser: jest.fn(),
};

jest.mock('../utils/firebase-admin.config', () => ({
  default: {
    auth: () => mockFirebaseAuth,
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 'firebase-uid-123',
    email: 'test@example.com',
    name: 'Test User',
    password: undefined,
    auth_token: undefined,
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
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerUserDto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const firebaseUser = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };

      mockFirebaseAuth.createUser.mockResolvedValue(firebaseUser);

      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register(registerUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(registerUserDto.email);
      expect(result.name).toBe(registerUserDto.name);
      expect(result.id).toBe(firebaseUser.uid);
      expect(mockFirebaseAuth.createUser).toHaveBeenCalledWith({
        email: registerUserDto.email,
        password: registerUserDto.password,
        displayName: registerUserDto.name,
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerUserDto: RegisterUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockFirebaseAuth.createUser.mockRejectedValue({
        code: 'auth/email-already-exists',
        message: 'Email already exists',
      });

      await expect(service.register(registerUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockFirebaseAuth.createUser).toHaveBeenCalledWith({
        email: registerUserDto.email,
        password: registerUserDto.password,
        displayName: registerUserDto.name,
      });
    });

    it('should throw generic error for other Firebase errors', async () => {
      const registerUserDto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockFirebaseAuth.createUser.mockRejectedValue({
        code: 'auth/some-other-error',
        message: 'Some other error',
      });

      await expect(service.register(registerUserDto)).rejects.toThrow(
        'Some other error',
      );
    });
  });
});
