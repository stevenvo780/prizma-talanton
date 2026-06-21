import { Test, TestingModule } from '@nestjs/testing';
import { PistisService } from './pistis.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('PistisService', () => {
  let service: PistisService;
  let http: jest.Mocked<HttpService>;

  beforeEach(async () => {
    http = { post: jest.fn().mockReturnValue(of({ data: { id: 1 } })) } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [PistisService, { provide: HttpService, useValue: http }],
    }).compile();
    service = module.get<PistisService>(PistisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create transaction', async () => {
    const tx = await service.createTransaction({}, 'key');
    expect(tx).toEqual({ id: 1 });
  });
});
