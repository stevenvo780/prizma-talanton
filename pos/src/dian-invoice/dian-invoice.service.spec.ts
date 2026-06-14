import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DianInvoiceService } from './dian-invoice.service';
import { DianInvoice } from './entities/dian-invoice.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Profile } from '../profile/entities/profile.entity';

jest.mock('./providers/alegra/alegra.provider', () => ({
  AlegraProvider: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    validateCredentials: jest.fn().mockResolvedValue(false),
    createInvoice: jest.fn(),
    getInvoiceStatus: jest.fn(),
    getInvoicePdf: jest.fn(),
    createCreditNote: jest.fn(),
    getNumberTemplates: jest.fn(),
  })),
}));

describe('DianInvoiceService', () => {
  let service: DianInvoiceService;

  const mockDianInvoiceRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockInvoiceRepo = { findOne: jest.fn() };

  const mockProfileRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianInvoiceService,
        { provide: getRepositoryToken(DianInvoice), useValue: mockDianInvoiceRepo },
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(Profile), useValue: mockProfileRepo },
      ],
    }).compile();

    service = module.get<DianInvoiceService>(DianInvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ───────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all dian invoices for a user', async () => {
      const mockInvoices = [{ id: 1, documentNumber: 'FE-001', cufe: 'abc123' }];
      mockDianInvoiceRepo.find.mockResolvedValue(mockInvoices);

      const result = await service.findAll('user-1');

      expect(result).toEqual(mockInvoices);
      expect(mockDianInvoiceRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' } },
        relations: ['invoice'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no dian invoices', async () => {
      mockDianInvoiceRepo.find.mockResolvedValue([]);
      const result = await service.findAll('user-2');
      expect(result).toEqual([]);
    });
  });

  // ─── configureProvider ────────────────────────────────────────────────────
  describe('configureProvider', () => {
    it('should throw BadRequestException if credentials are invalid (alegra)', async () => {
      // configureProvider: primera llamada → no existe perfil → crea nuevo
      mockProfileRepo.findOne
        .mockResolvedValueOnce(null)   // primera: configureProvider
        .mockResolvedValueOnce({       // segunda: dentro de getProvider
          dianConfig: {
            providerName: 'alegra',
            email: 'test@test.com',
            token: 'invalid-token',
          },
        });
      // save: guarda con config, luego revierte
      mockProfileRepo.save.mockResolvedValue({});

      await expect(
        service.configureProvider(
          { providerName: 'alegra', email: 'test@test.com', token: 'invalid-token' },
          { id: 'user-1' } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unsupported provider', async () => {
      mockProfileRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          dianConfig: { providerName: 'siigo', email: 'x@x.com', token: 'tok' },
        });
      mockProfileRepo.save.mockResolvedValue({});

      await expect(
        service.configureProvider(
          { providerName: 'siigo', email: 'x@x.com', token: 'tok' },
          { id: 'user-1' } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update existing profile when re-configuring', async () => {
      const existingProfile = new Profile();
      existingProfile.id = 5;
      existingProfile.dianConfig = null;

      mockProfileRepo.findOne
        .mockResolvedValueOnce(existingProfile) // configureProvider: profile exists
        .mockResolvedValueOnce({               // getProvider: after save
          dianConfig: { providerName: 'alegra', email: 'a@b.com', token: 't' },
        });
      mockProfileRepo.save.mockResolvedValue(existingProfile);

      await expect(
        service.configureProvider(
          { providerName: 'alegra', email: 'a@b.com', token: 't' },
          { id: 'user-1' } as any,
        ),
      ).rejects.toThrow(BadRequestException); // credentials invalid (mock returns false)

      expect(mockProfileRepo.save).toHaveBeenCalled();
    });
  });

  // ─── getProvider edge cases (via configureProvider) ───────────────────────
  describe('getProvider edge cases', () => {
    it('should throw BadRequestException when dianConfig is null on getProvider', async () => {
      mockProfileRepo.findOne
        .mockResolvedValueOnce(null)   // configureProvider: no profile initially
        .mockResolvedValueOnce({ dianConfig: null }); // getProvider: profile without config
      mockProfileRepo.save.mockResolvedValue({});

      await expect(
        service.configureProvider(
          { providerName: 'alegra', email: 'x@y.com', token: 't' },
          { id: 'user-1' } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
