import { Test, TestingModule } from '@nestjs/testing';
import { FiarService } from './fiar.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('FiarService', () => {
  let service: FiarService;
  let http: jest.Mocked<HttpService>;

  beforeEach(async () => {
    http = { post: jest.fn().mockReturnValue(of({ data: { id: 1 } })) } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [FiarService, { provide: HttpService, useValue: http }],
    }).compile();
    service = module.get<FiarService>(FiarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create transaction', async () => {
    const tx = await service.createTransaction({}, 'key');
    expect(tx).toEqual({ id: 1 });
  });
});
