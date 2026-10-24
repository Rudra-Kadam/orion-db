import { describe, it, expect } from 'vitest';
import { parseSetCookieHeader } from './cookies';
import { COOKIE_KEYS } from '@orion/constants';
import { assertAndReportWeb } from '../../test-logger';

describe('Frontend Auth Cookie Utilities', () => {
  it('WEB-AUTH-01 | Parse full Set-Cookie header with all directives | Expected: Structured ParsedCookie', () => {
    const rawHeader =
      'access_token=jwt.token.val; Path=/api; Max-Age=900; HttpOnly; Secure; SameSite=Lax';

    const parsed = parseSetCookieHeader(rawHeader);

    assertAndReportWeb(
      {
        id: 'WEB-AUTH-01',
        name: 'Full Set-Cookie header parsing',
        scenario: rawHeader,
        expected: 'Parsed cookie with name="access_token", maxAge=900, httpOnly=true, secure=true, sameSite="lax"',
        actual: `name="${parsed.name}", maxAge=${parsed.options.maxAge}, httpOnly=${parsed.options.httpOnly}, secure=${parsed.options.secure}`,
      },
      () => {
        expect(parsed.name).toBe('access_token');
        expect(parsed.value).toBe('jwt.token.val');
        expect(parsed.options.path).toBe('/api');
        expect(parsed.options.maxAge).toBe(900);
        expect(parsed.options.httpOnly).toBe(true);
        expect(parsed.options.secure).toBe(true);
        expect(parsed.options.sameSite).toBe('lax');
      },
    );
  });

  it('WEB-AUTH-02 | Parse minimal Set-Cookie header | Expected: Sensible defaults applied', () => {
    const rawHeader = 'refresh_token=refresh.val.123';

    const parsed = parseSetCookieHeader(rawHeader);

    assertAndReportWeb(
      {
        id: 'WEB-AUTH-02',
        name: 'Minimal cookie header parsing',
        scenario: rawHeader,
        expected: 'Default path="/", httpOnly=false, secure=false, sameSite="lax"',
        actual: `path="${parsed.options.path}", httpOnly=${parsed.options.httpOnly}, secure=${parsed.options.secure}`,
      },
      () => {
        expect(parsed.name).toBe('refresh_token');
        expect(parsed.value).toBe('refresh.val.123');
        expect(parsed.options.path).toBe('/');
        expect(parsed.options.httpOnly).toBe(false);
        expect(parsed.options.secure).toBe(false);
        expect(parsed.options.sameSite).toBe('lax');
      },
    );
  });

  it('WEB-AUTH-03 | Identify standard Orion auth cookies | Expected: Known constants recognized', () => {
    const isAuth = (name: string) =>
      name === COOKIE_KEYS.ACCESS_TOKEN || name === COOKIE_KEYS.REFRESH_TOKEN;

    const accessOk = isAuth('access_token');
    const refreshOk = isAuth('refresh_token');
    const randomIgnored = isAuth('session_random');

    assertAndReportWeb(
      {
        id: 'WEB-AUTH-03',
        name: 'Auth cookie constant recognition',
        scenario: 'Testing access_token, refresh_token, session_random',
        expected: 'access_token=true, refresh_token=true, session_random=false',
        actual: `access=${accessOk}, refresh=${refreshOk}, random=${randomIgnored}`,
      },
      () => {
        expect(accessOk).toBe(true);
        expect(refreshOk).toBe(true);
        expect(randomIgnored).toBe(false);
      },
    );
  });
});
