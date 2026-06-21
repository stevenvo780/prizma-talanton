import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppProvider } from './app.provider';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockAppProvider = {
      getApp: jest.fn().mockReturnValue({
        getHttpServer: jest.fn().mockReturnValue({
          _events: {
            request: {
              _router: {
                stack: [],
              },
            },
          },
        }),
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: AppProvider,
          useValue: mockAppProvider,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return welcome message', () => {
      expect(appController.getHello()).toBe(
        'Bienvenido a prizma, puedes ver la documentación en /api',
      );
    });
  });

  describe('health check', () => {
    it('should return health status', () => {
      const result = appController.getHello();
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('routes', () => {
    it('should return routes array', () => {
      const result = appController.getRoutes();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
