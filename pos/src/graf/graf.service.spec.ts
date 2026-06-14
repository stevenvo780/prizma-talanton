import { Test, TestingModule } from '@nestjs/testing';
import { GrafService, GrafOrderStatusType } from './graf.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('GrafService', () => {
  let service: GrafService;
  let http: jest.Mocked<HttpService>;

  beforeEach(async () => {
    http = {
      patch: jest.fn().mockReturnValue(of({ data: { ok: true } })),
    } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [GrafService, { provide: HttpService, useValue: http }],
    }).compile();
    service = module.get<GrafService>(GrafService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update order status', async () => {
    await service.updateOrderStatusFromInvoice(
      { tracking_number: 1 } as any,
      GrafOrderStatusType.PAID,
      'token',
    );
    expect(http.patch).toHaveBeenCalled();
  });
});
