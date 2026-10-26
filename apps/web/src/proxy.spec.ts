import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { COOKIE_KEYS } from '@orion/constants';
import * as jose from 'jose';
import { proxy } from './proxy';
import { assertAndReportWeb } from './test-logger';

describe('Frontend Middleware Proxy Protection (proxy)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test_secret_for_proxy_unit_tests_123456';
    process.env.API_URL = 'http://localhost:3001/api';
  });

  // WEB-PROXY-01: Protected route redirection without credentials
  it('WEB-PROXY-01 | Protected dashboard route without token | Expected: Redirect to /login', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/dashboard'));

    const response = await proxy(req);

    const isRedirect = response?.status === 307 || response?.status === 302;
    const location = response?.headers.get('location') || '';

    assertAndReportWeb(
      {
        id: 'WEB-PROXY-01',
        name: 'Protected route unauthorized redirection',
        scenario: 'pathname="/dashboard", cookies={}',
        expected: 'HTTP 307/302 Redirect to /login',
        actual: `status=${response?.status}, location="${location}"`,
      },
      () => {
        expect(isRedirect).toBe(true);
        expect(location).toContain('/login');
      },
    );
  });

  // WEB-PROXY-02: Authenticated user visiting /login redirected to /dashboard
  it('WEB-PROXY-02 | Authenticated user accessing /login | Expected: Redirect to /dashboard', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const validToken = await new jose.SignJWT({ sub: 'usr_1', email: 'test@orion.dev' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);

    const req = new NextRequest(new URL('http://localhost:3000/login'), {
      headers: {
        cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${validToken}`,
      },
    });

    const response = await proxy(req);
    const location = response?.headers.get('location') || '';

    assertAndReportWeb(
      {
        id: 'WEB-PROXY-02',
        name: 'Authenticated user auth-route redirection',
        scenario: 'pathname="/login", valid accessToken present',
        expected: 'HTTP 307/302 Redirect to /dashboard',
        actual: `status=${response?.status}, location="${location}"`,
      },
      () => {
        expect(response?.status === 307 || response?.status === 302).toBe(true);
        expect(location).toContain('/dashboard');
      },
    );
  });
});
