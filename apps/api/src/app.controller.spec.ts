import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { assertAndReport } from '../test/test-logger';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('SYS-01 | Health endpoint check | Expected: Status OK & ISO timestamp', () => {
      const res = appController.health();

      assertAndReport(
        {
          id: 'SYS-01',
          name: 'System health check endpoint',
          scenario: 'GET /health',
          expected: 'status="ok" and timestamp in ISO format',
          actual: `status="${res.status}", timestamp="${res.timestamp}"`,
        },
        () => {
          expect(res).toHaveProperty('status', 'ok');
          expect(res).toHaveProperty('timestamp');
        },
      );
    });
  });
});
