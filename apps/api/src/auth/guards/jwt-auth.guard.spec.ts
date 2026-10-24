import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { COOKIE_KEYS } from '@orion/constants';
import type { JwtPayload } from '@orion/types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { assertAndReport } from '../../../test/test-logger';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    };
    guard = new JwtAuthGuard(
      jwtService as JwtService,
      configService as ConfigService,
    );
  });

  const createMockContext = (cookies: Record<string, any> = {}) => {
    const request: any = {
      cookies,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    };
  };

  // Negative Case 1: Unauthenticated request (no cookie)
  it('GUARD-01 | Unauthenticated access to protected endpoint | Expected: Access denied (401)', () => {
    const { request, switchToHttp } = createMockContext({});
    const context = { switchToHttp } as unknown as ExecutionContext;

    let error: any;
    try {
      guard.canActivate(context);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'GUARD-01',
        name: 'Missing JWT auth cookie',
        scenario: 'cookies={}',
        expected: 'HTTP 401 UnauthorizedException("Not authenticated")',
        actual: `HTTP ${error?.status || 401} Unauthorized, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Not authenticated');
      },
    );
  });

  // Negative Case 2: Tampered or expired token
  it('GUARD-02 | Invalid or expired token | Expected: Access denied (401)', () => {
    const { request, switchToHttp } = createMockContext({
      [COOKIE_KEYS.ACCESS_TOKEN]: 'expired-or-tampered-token',
    });
    const context = { switchToHttp } as unknown as ExecutionContext;

    (jwtService.verify as jest.Mock).mockImplementationOnce(() => {
      throw new Error('jwt expired');
    });

    let error: any;
    try {
      guard.canActivate(context);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'GUARD-02',
        name: 'Expired/invalid JWT token rejection',
        scenario: 'cookies.access_token="expired-or-tampered-token"',
        expected: 'HTTP 401 UnauthorizedException("Invalid or expired token")',
        actual: `HTTP ${error?.status || 401} Unauthorized, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid or expired token');
      },
    );
  });

  // Positive Case 3: Valid access token
  it('GUARD-03 | Valid access token provided | Expected: Access granted (200) & user attached', () => {
    const mockPayload: JwtPayload = {
      sub: 'usr_abc123',
      email: 'alex@orion.dev',
    };

    const { request, switchToHttp } = createMockContext({
      [COOKIE_KEYS.ACCESS_TOKEN]: 'valid-signed-access-token',
    });
    const context = { switchToHttp } as unknown as ExecutionContext;

    (jwtService.verify as jest.Mock).mockReturnValueOnce(mockPayload);

    const result = guard.canActivate(context);

    assertAndReport(
      {
        id: 'GUARD-03',
        name: 'Valid JWT verification',
        scenario: 'cookies.access_token="valid-signed-access-token"',
        expected: 'Returns true, attaches user payload to request["user"]',
        actual: `canActivate=${result}, request.user=${JSON.stringify(request.user)}`,
      },
      () => {
        expect(result).toBe(true);
        expect(request.user).toEqual(mockPayload);
      },
    );
  });
});
