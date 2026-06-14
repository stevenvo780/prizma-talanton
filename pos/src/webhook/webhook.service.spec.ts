import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Webhook, HttpMethod } from './entities/webhook.entity';
import { User } from '../user/entities/user.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

describe('WebhookService', () => {
  let service: WebhookService;

  const mockWebhookRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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

  const mockWebhook: Webhook = {
    id: 1,
    bounceRoute: '/webhook/bounce',
    targetUrl: 'https://example.com/webhook',
    httpMethod: HttpMethod.POST,
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: getRepositoryToken(Webhook),
          useValue: mockWebhookRepository,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new webhook', async () => {
      const createWebhookDto: CreateWebhookDto = {
        bounceRoute: '/webhook/bounce',
        targetUrl: 'https://example.com/webhook',
        httpMethod: HttpMethod.POST,
      };

      mockWebhookRepository.create.mockReturnValue(mockWebhook);
      mockWebhookRepository.save.mockResolvedValue(mockWebhook);

      const result = await service.create(createWebhookDto, mockUser);

      expect(mockWebhookRepository.create).toHaveBeenCalledWith(
        createWebhookDto,
      );
      expect(mockWebhookRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockWebhook);
    });
  });

  describe('findAll', () => {
    it('should return all webhooks for a user', async () => {
      const userId = 'user-1';
      const expectedWebhooks = [mockWebhook];

      mockWebhookRepository.find.mockResolvedValue(expectedWebhooks);

      const result = await service.findAll(userId);

      expect(mockWebhookRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      expect(result).toEqual(expectedWebhooks);
    });
  });

  describe('findOne', () => {
    it('should return a webhook by id and userId', async () => {
      const webhookId = 1;
      const userId = 'user-1';

      mockWebhookRepository.findOne.mockResolvedValue(mockWebhook);

      const result = await service.findOne(webhookId, userId);

      expect(mockWebhookRepository.findOne).toHaveBeenCalledWith({
        where: { id: webhookId, user: { id: userId } },
        relations: ['user'],
      });
      expect(result).toEqual(mockWebhook);
    });
  });

  describe('update', () => {
    it('should update a webhook successfully', async () => {
      const webhookId = 1;
      const updateWebhookDto: UpdateWebhookDto = {
        targetUrl: 'https://updated.com/webhook',
      };

      const updateResult = { affected: 1, raw: [], generatedMaps: [] };
      mockWebhookRepository.update.mockResolvedValue(updateResult);

      const result = await service.update(webhookId, updateWebhookDto);

      expect(mockWebhookRepository.update).toHaveBeenCalledWith(
        webhookId,
        updateWebhookDto,
      );
      expect(result).toEqual(updateResult);
    });
  });

  describe('remove', () => {
    it('should delete a webhook', async () => {
      const webhookId = 1;
      const deleteResult = { affected: 1, raw: [] };

      mockWebhookRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.remove(webhookId);

      expect(mockWebhookRepository.delete).toHaveBeenCalledWith(webhookId);
      expect(result).toEqual(deleteResult);
    });
  });
});
