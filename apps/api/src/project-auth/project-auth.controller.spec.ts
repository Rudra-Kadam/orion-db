import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ProjectAuthController } from './project-auth.controller';
import { ProjectAuthService } from './project-auth.service';
import { assertAndReport } from '../../test/test-logger';

describe('ProjectAuthController - OAuth Callback Token Fragment Security', () => {
  let controller: ProjectAuthController;
  let projectAuthService: jest.Mocked<Partial<ProjectAuthService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let mockResponse: {
    redirect: jest.Mock;
    status: jest.Mock;
    json: jest.Mock;
  };

  beforeEach(async () => {
    mockResponse = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    projectAuthService = {
      handleGoogleCallback: jest.fn(),
      handleGithubCallback: jest.fn(),
      getSiteUrlForProject: jest.fn(),
      getOAuthSettings: jest.fn(),
      buildGoogleAuthUrl: jest.fn(),
      buildGithubAuthUrl: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'API_URL') return 'http://localhost:3001';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectAuthController],
      providers: [
        { provide: ProjectAuthService, useValue: projectAuthService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<ProjectAuthController>(ProjectAuthController);
  });

  it('OAUTH-01 | Google callback redirects to URL fragment (#access_token=...) and never query string (?access_token=...)', async () => {
    const mockToken = 'mock-google-jwt-access-token';
    const siteUrl = 'https://my-app.com';

    (
      projectAuthService.handleGoogleCallback as jest.Mock
    ).mockResolvedValueOnce({
      accessToken: mockToken,
      user: { id: 'usr_123', email: 'user@example.com' },
    });
    (
      projectAuthService.getSiteUrlForProject as jest.Mock
    ).mockResolvedValueOnce(siteUrl);

    await controller.googleCallback(
      'proj_alpha',
      'google-auth-code-123',
      mockResponse as unknown as Response,
    );

    const redirectUrl = mockResponse.redirect.mock.calls[0][0] as string;

    assertAndReport(
      {
        id: 'OAUTH-01',
        name: 'Google OAuth callback uses fragment instead of query params',
        scenario: `siteUrl=${siteUrl}, code=google-auth-code-123`,
        expected:
          'Redirect contains #access_token=... and does NOT contain ?access_token=',
        actual: `redirectUrl=${redirectUrl}`,
      },
      () => {
        expect(mockResponse.redirect).toHaveBeenCalledTimes(1);
        expect(redirectUrl).toContain(
          '#access_token=mock-google-jwt-access-token',
        );
        expect(redirectUrl).toContain('token_type=bearer');
        expect(redirectUrl).not.toContain('?access_token=');
      },
    );
  });

  it('OAUTH-02 | GitHub callback redirects to URL fragment (#access_token=...) and never query string (?access_token=...)', async () => {
    const mockToken = 'mock-github-jwt-access-token';
    const siteUrl = 'https://portal.dev';

    (
      projectAuthService.handleGithubCallback as jest.Mock
    ).mockResolvedValueOnce({
      accessToken: mockToken,
      user: { id: 'usr_456', email: 'dev@portal.dev' },
    });
    (
      projectAuthService.getSiteUrlForProject as jest.Mock
    ).mockResolvedValueOnce(siteUrl);

    await controller.githubCallback(
      'proj_beta',
      'github-auth-code-456',
      mockResponse as unknown as Response,
    );

    const redirectUrl = mockResponse.redirect.mock.calls[0][0] as string;

    assertAndReport(
      {
        id: 'OAUTH-02',
        name: 'GitHub OAuth callback uses fragment instead of query params',
        scenario: `siteUrl=${siteUrl}, code=github-auth-code-456`,
        expected:
          'Redirect contains #access_token=... and does NOT contain ?access_token=',
        actual: `redirectUrl=${redirectUrl}`,
      },
      () => {
        expect(mockResponse.redirect).toHaveBeenCalledTimes(1);
        expect(redirectUrl).toContain(
          '#access_token=mock-github-jwt-access-token',
        );
        expect(redirectUrl).toContain('token_type=bearer');
        expect(redirectUrl).not.toContain('?access_token=');
      },
    );
  });

  it('OAUTH-03 | Callback preserves existing siteUrl path and query parameters while appending fragment', async () => {
    const mockToken = 'token_xyz_789';
    const siteUrl =
      'https://client.app.org:8080/auth/callback?theme=dark&ref=onboarding';

    (
      projectAuthService.handleGoogleCallback as jest.Mock
    ).mockResolvedValueOnce({
      accessToken: mockToken,
      user: { id: 'usr_789', email: 'sam@app.org' },
    });
    (
      projectAuthService.getSiteUrlForProject as jest.Mock
    ).mockResolvedValueOnce(siteUrl);

    await controller.googleCallback(
      'proj_gamma',
      'code_789',
      mockResponse as unknown as Response,
    );

    const redirectUrl = mockResponse.redirect.mock.calls[0][0] as string;
    const parsed = new URL(redirectUrl);

    assertAndReport(
      {
        id: 'OAUTH-03',
        name: 'Preserves siteUrl path and query while fragment carries credentials',
        scenario: `siteUrl=${siteUrl}`,
        expected:
          'pathname="/auth/callback", search="?theme=dark&ref=onboarding", hash="#access_token=...&token_type=bearer"',
        actual: `pathname="${parsed.pathname}", search="${parsed.search}", hash="${parsed.hash}"`,
      },
      () => {
        expect(parsed.pathname).toBe('/auth/callback');
        expect(parsed.searchParams.get('theme')).toBe('dark');
        expect(parsed.searchParams.get('ref')).toBe('onboarding');
        expect(parsed.searchParams.get('access_token')).toBeNull();
        const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
        expect(hashParams.get('access_token')).toBe('token_xyz_789');
        expect(hashParams.get('token_type')).toBe('bearer');
      },
    );
  });

  it('OAUTH-04 | Google login initiates OAuth flow with redirect URI', async () => {
    (projectAuthService.getOAuthSettings as jest.Mock).mockResolvedValueOnce({
      googleClientId: 'google-client-id-123',
    });
    (projectAuthService.buildGoogleAuthUrl as jest.Mock).mockReturnValueOnce(
      'https://accounts.google.com/o/oauth2/v2/auth?mock=true',
    );

    await controller.googleLogin(
      'proj_alpha',
      mockResponse as unknown as Response,
    );

    assertAndReport(
      {
        id: 'OAUTH-04',
        name: 'Google login redirect to provider',
        scenario: 'googleClientId configured',
        expected: 'Redirect to Google OAuth consent URL',
        actual:
          'Redirect called with https://accounts.google.com/o/oauth2/v2/auth?mock=true',
      },
      () => {
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          'https://accounts.google.com/o/oauth2/v2/auth?mock=true',
        );
      },
    );
  });

  it('OAUTH-05 | GitHub login initiates OAuth flow with redirect URI', async () => {
    (projectAuthService.getOAuthSettings as jest.Mock).mockResolvedValueOnce({
      githubClientId: 'github-client-id-456',
    });
    (projectAuthService.buildGithubAuthUrl as jest.Mock).mockReturnValueOnce(
      'https://github.com/login/oauth/authorize?mock=true',
    );

    await controller.githubLogin(
      'proj_beta',
      mockResponse as unknown as Response,
    );

    assertAndReport(
      {
        id: 'OAUTH-05',
        name: 'GitHub login redirect to provider',
        scenario: 'githubClientId configured',
        expected: 'Redirect to GitHub OAuth consent URL',
        actual:
          'Redirect called with https://github.com/login/oauth/authorize?mock=true',
      },
      () => {
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          'https://github.com/login/oauth/authorize?mock=true',
        );
      },
    );
  });
});
