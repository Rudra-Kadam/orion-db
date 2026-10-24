import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PROJECT_KEY_ROLES } from '@orion/constants';
import { ProjectKeyGuard, ProjectKeyPayload } from './project-key.guard';
import { assertAndReport } from '../../test/test-logger';

describe('ProjectKeyGuard', () => {
  let guard: ProjectKeyGuard;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('test-project-jwt-secret'),
    };
    guard = new ProjectKeyGuard(
      jwtService as JwtService,
      configService as ConfigService,
    );
  });

  const createMockContext = (headers: Record<string, any> = {}) => {
    const request: any = {
      headers,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    };
  };

  // Negative Case 1: Missing Authorization Header
  it('APIKEY-01 | Missing API key authorization header | Expected: Access denied (401)', () => {
    const { switchToHttp } = createMockContext({});
    const context = { switchToHttp } as unknown as ExecutionContext;

    let error: any;
    try {
      guard.canActivate(context);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'APIKEY-01',
        name: 'Missing Authorization header',
        scenario: 'headers={}',
        expected: 'HTTP 401 UnauthorizedException("Missing API key")',
        actual: `HTTP ${error?.status || 401} Unauthorized, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Missing API key');
      },
    );
  });

  // Negative Case 2: Invalid Bearer token
  it('APIKEY-02 | Invalid or corrupted API key | Expected: Access denied (401)', () => {
    const { switchToHttp } = createMockContext({
      authorization: 'Bearer corrupted.api.key.signature',
    });
    const context = { switchToHttp } as unknown as ExecutionContext;

    (jwtService.verify as jest.Mock).mockImplementationOnce(() => {
      throw new Error('invalid signature');
    });

    let error: any;
    try {
      guard.canActivate(context);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'APIKEY-02',
        name: 'Invalid Bearer token rejection',
        scenario: 'authorization="Bearer corrupted.api.key.signature"',
        expected: 'HTTP 401 UnauthorizedException("Invalid API key")',
        actual: `HTTP ${error?.status || 401} Unauthorized, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid API key');
      },
    );
  });

  // Positive Case 3: Valid Project Key
  it('APIKEY-03 | Valid Project API key provided | Expected: Access granted (200) & projectKey attached', () => {
    const mockPayload: ProjectKeyPayload = {
      projectId: 'proj_98765',
      role: PROJECT_KEY_ROLES.ANON,
    };

    const { request, switchToHttp } = createMockContext({
      authorization: 'Bearer valid.jwt.project.key',
    });
    const context = { switchToHttp } as unknown as ExecutionContext;

    (jwtService.verify as jest.Mock).mockReturnValueOnce(mockPayload);

    const result = guard.canActivate(context);

    assertAndReport(
      {
        id: 'APIKEY-03',
        name: 'Valid Project API key accepted',
        scenario: 'authorization="Bearer valid.jwt.project.key" (role=anon)',
        expected: 'Returns true, attaches projectKey payload to request["projectKey"]',
        actual: `canActivate=${result}, role=${request.projectKey?.role}, projectId=${request.projectKey?.projectId}`,
      },
      () => {
        expect(result).toBe(true);
        expect(request.projectKey).toEqual(mockPayload);
      },
    );
  });
});
