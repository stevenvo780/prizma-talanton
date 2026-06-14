import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { ClientService } from './client.service';
import { Client } from './entities/client.entity';
import { User } from '../user/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

describe('ClientService', () => {
  let service: ClientService;

  const mockClientRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
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

  const mockClient: Client = {
    id: 'client-1',
    name: 'Test Client',
    surname: 'Test Surname',
    email: 'client@example.com',
    phone: '123456789',
    address: 'Test Address',
    documentNumber: '12345678',
    typeDocument: null,
    user: mockUser,
    invoices: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientRepository,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new client when no existing client found', async () => {
      const createClientDto: CreateClientDto = {
        name: 'New Client',
        surname: 'New Surname',
        email: 'new@example.com',
        phone: '987654321',
        documentNumber: '87654321',
      };

      mockClientRepository.findOne.mockResolvedValue(null);
      mockClientRepository.save.mockResolvedValue(mockClient);

      const result = await service.create(createClientDto, mockUser);

      expect(mockClientRepository.findOne).toHaveBeenCalledTimes(3);
      expect(mockClientRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockClient);
    });

    it('should throw ConflictException when client found by documentNumber', async () => {
      const createClientDto: CreateClientDto = {
        name: 'Existing Client',
        documentNumber: '12345678',
      };

      mockClientRepository.findOne.mockResolvedValueOnce(mockClient);

      await expect(service.create(createClientDto, mockUser)).rejects.toThrow(
        ConflictException,
      );
      expect(mockClientRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when client found by phone', async () => {
      const createClientDto: CreateClientDto = {
        name: 'Existing Client',
        phone: '123456789',
        // sin documentNumber → solo se llama findOne para phone
      };

      mockClientRepository.findOne
        .mockResolvedValueOnce(mockClient); // phone found (única llamada porque no hay documentNumber)

      await expect(service.create(createClientDto, mockUser)).rejects.toThrow(
        ConflictException,
      );
      expect(mockClientRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when client found by email', async () => {
      const createClientDto: CreateClientDto = {
        name: 'Existing Client',
        email: 'client@example.com',
        // sin documentNumber ni phone → solo se llama findOne para email
      };

      mockClientRepository.findOne
        .mockResolvedValueOnce(mockClient); // email found (única llamada)

      await expect(service.create(createClientDto, mockUser)).rejects.toThrow(
        ConflictException,
      );
      expect(mockClientRepository.save).not.toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const createClientDto: CreateClientDto = {
        email: 'new@example.com',
        name: 'New Client',
      };

      mockClientRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const testError = new Error('Save operation failed');
      mockClientRepository.save.mockImplementation(() => { throw testError; });

      await expect(service.create(createClientDto, mockUser)).rejects.toThrow('Save operation failed');
    });
  });

  describe('findAll', () => {
    it('should return all clients for a user ordered by id desc', async () => {
      const userId = 'user-1';
      const expectedClients = [mockClient];

      mockClientRepository.find.mockResolvedValue(expectedClients);

      const result = await service.findAll(userId);

      expect(mockClientRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        order: { id: 'DESC' },
      });
      expect(result).toEqual(expectedClients);
    });

    it('should return empty array when no clients found', async () => {
      const userId = 'user-1';

      mockClientRepository.find.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a client by id and userId with invoices relation', async () => {
      const clientId = 'client-1';
      const userId = 'user-1';

      mockClientRepository.findOne.mockReset();
      mockClientRepository.findOne.mockResolvedValue(mockClient);

      const result = await service.findOne(clientId, userId);

      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { id: clientId, user: { id: userId } },
        relations: ['invoices'],
      });
      expect(result).toEqual(mockClient);
    });

    it('should return null when client not found', async () => {
      const clientId = 'non-existent';
      const userId = 'user-1';

      mockClientRepository.findOne.mockReset();
      mockClientRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(clientId, userId);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a client successfully', async () => {
      const clientId = 'client-1';
      const updateClientDto: UpdateClientDto = { name: 'Updated Client', email: 'updated@example.com' };
      const updateResult = { affected: 1, raw: [], generatedMaps: [] };

      mockClientRepository.update.mockResolvedValue(updateResult);
      const result = await service.update(clientId, updateClientDto);

      expect(mockClientRepository.update).toHaveBeenCalledWith(clientId, updateClientDto);
      expect(result).toEqual(updateResult);
    });

    it('should handle update when client does not exist', async () => {
      const updateResult = { affected: 0, raw: [], generatedMaps: [] };
      mockClientRepository.update.mockResolvedValue(updateResult);
      const result = await service.update('non-existent', { name: 'X' });
      expect(result.affected).toBe(0);
    });
  });

  describe('remove', () => {
    it('should delete a client successfully', async () => {
      const deleteResult = { affected: 1, raw: [] };
      mockClientRepository.delete.mockResolvedValue(deleteResult);
      const result = await service.remove('client-1');
      expect(mockClientRepository.delete).toHaveBeenCalledWith('client-1');
      expect(result).toEqual(deleteResult);
    });

    it('should handle deletion when client does not exist', async () => {
      const deleteResult = { affected: 0, raw: [] };
      mockClientRepository.delete.mockResolvedValue(deleteResult);
      const result = await service.remove('non-existent');
      expect(result.affected).toBe(0);
    });

    it('should handle deletion errors', async () => {
      mockClientRepository.delete.mockRejectedValue(new Error('Delete failed'));
      await expect(service.remove('client-1')).rejects.toThrow('Delete failed');
    });
  });
});
