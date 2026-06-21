import { Test, TestingModule } from '@nestjs/testing';
import { HermesService, HermesOrderStatusType } from './hermes.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('HermesService', () => {
  let service: HermesService;
  let http: jest.Mocked<HttpService>;

  beforeEach(async () => {
    http = {
      patch: jest.fn().mockReturnValue(of({ data: { ok: true } })),
    } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [HermesService, { provide: HttpService, useValue: http }],
    }).compile();
    service = module.get<HermesService>(HermesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update order status', async () => {
    await service.updateOrderStatusFromInvoice(
      { tracking_number: 1 } as any,
      HermesOrderStatusType.PAID,
      'token',
    );
    expect(http.patch).toHaveBeenCalled();
  });
});
