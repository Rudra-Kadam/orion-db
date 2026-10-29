import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InviteService } from '../members/invite.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { assertAndReport } from '../../test/test-logger';

describe('AuthController & Authentication Workflow', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let inviteService: jest.Mocked<Partial<InviteService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };

    authService = {
      login: jest.fn(),
      register: jest.fn(),
      setTokenCookies: jest.fn(),
      clearTokenCookies: jest.fn(),
      refreshTokens: jest.fn(),
      signTokens: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    inviteService = {
      acceptInvite: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
        { provide: InviteService, useValue: inviteService },
        { provide: JwtService, useValue: jwtService },
        JwtAuthGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // Positive Case 1
  it('AUTH-01 | Valid email and valid password | Expected: Login succeeds', async () => {
    const input: LoginDto = {
      email: 'alex@orion.dev',
      password: 'StrongPassword123!',
    };
    const mockTokens = {
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
    };

    (authService.login as jest.Mock).mockResolvedValueOnce(mockTokens);

    const result = await controller.login(input, mockResponse as Response);

    assertAndReport(
      {
        id: 'AUTH-01',
        name: 'Valid credentials login',
        scenario: `email=${input.email}, password=******`,
        expected: 'HTTP 200 OK & Logged in successfully with cookies set',
        actual: `message=${result.message}, tokens generated & setTokenCookies invoked`,
      },
      () => {
        expect(result).toEqual({ message: 'Logged in successfully' });
        expect(authService.login).toHaveBeenCalledWith(input);
        expect(authService.setTokenCookies).toHaveBeenCalledWith(
          mockResponse,
          mockTokens,
        );
      },
    );
  });

  // Negative Case 1: Non-existent email
  it('AUTH-02 | Non-existent email with valid password | Expected: Login rejected', async () => {
    const input: LoginDto = {
      email: 'unknown@orion.dev',
      password: 'ValidPassword123!',
    };

    (authService.login as jest.Mock).mockRejectedValueOnce(
      new UnauthorizedException('Invalid credentials'),
    );

    let error: any;
    try {
      await controller.login(input, mockResponse as Response);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'AUTH-02',
        name: 'Non-existent email login',
        scenario: `email=${input.email}, password=******`,
        expected: 'HTTP 401 Unauthorized with message "Invalid credentials"',
        actual: `HTTP ${error?.status || 401} Unauthorized, message=${error?.message}`,
      },
      () => {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid credentials');
        expect(authService.setTokenCookies).not.toHaveBeenCalled();
      },
    );
  });

  // Negative Case 2: Valid email with incorrect password
  it('AUTH-03 | Valid email and invalid password | Expected: Login rejected', async () => {
    const input: LoginDto = {
      email: 'alex@orion.dev',
      password: 'IncorrectPassword999',
    };

    (authService.login as jest.Mock).mockRejectedValueOnce(
      new UnauthorizedException('Invalid credentials'),
    );

    let error: any;
    try {
      await controller.login(input, mockResponse as Response);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'AUTH-03',
        name: 'Incorrect password login',
        scenario: `email=${input.email}, password=incorrect`,
        expected: 'HTTP 401 Unauthorized with message "Invalid credentials"',
        actual: `HTTP ${error?.status || 401} Unauthorized, message=${error?.message}`,
      },
      () => {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid credentials');
        expect(authService.setTokenCookies).not.toHaveBeenCalled();
      },
    );
  });

  // Negative Case 3: Missing password in login DTO
  it('AUTH-04 | Missing password | Expected: Validation error', async () => {
    const rawInput = { email: 'alex@orion.dev' };
    const dto = plainToInstance(LoginDto, rawInput);
    const errors = await validate(dto);

    const hasPasswordError = errors.some(
      (e) => e.property === 'password' && e.constraints?.isString,
    );

    assertAndReport(
      {
        id: 'AUTH-04',
        name: 'Missing password validation',
        scenario: JSON.stringify(rawInput),
        expected: 'Validation error: password must be a string',
        actual: `Validation error detected on property: ${errors.map((e) => e.property).join(', ')}`,
      },
      () => {
        expect(errors.length).toBeGreaterThan(0);
        expect(hasPasswordError).toBe(true);
      },
    );
  });

  // Negative Case 4: Missing email in login DTO
  it('AUTH-05 | Missing username/email | Expected: Validation error', async () => {
    const rawInput = { password: 'ValidPassword123!' };
    const dto = plainToInstance(LoginDto, rawInput);
    const errors = await validate(dto);

    const hasEmailError = errors.some(
      (e) => e.property === 'email' && e.constraints?.isEmail,
    );

    assertAndReport(
      {
        id: 'AUTH-05',
        name: 'Missing email validation',
        scenario: JSON.stringify(rawInput),
        expected: 'Validation error: email must be an email',
        actual: `Validation error detected on property: ${errors.map((e) => e.property).join(', ')}`,
      },
      () => {
        expect(errors.length).toBeGreaterThan(0);
        expect(hasEmailError).toBe(true);
      },
    );
  });

  // Negative Case 5: Both username and password missing
  it('AUTH-06 | Both username and password missing | Expected: Validation errors', async () => {
    const rawInput = {};
    const dto = plainToInstance(LoginDto, rawInput);
    const errors = await validate(dto);

    const errorProperties = errors.map((e) => e.property);

    assertAndReport(
      {
        id: 'AUTH-06',
        name: 'Empty credentials validation',
        scenario: '{} (empty payload)',
        expected: 'Validation errors on both "email" and "password"',
        actual: `Errors returned for properties: [${errorProperties.join(', ')}]`,
      },
      () => {
        expect(errorProperties).toContain('email');
        expect(errorProperties).toContain('password');
      },
    );
  });

  // Negative Case 6: Invalid email format
  it('AUTH-07 | Invalid email format | Expected: Validation error', async () => {
    const rawInput = {
      email: 'not-a-valid-email-string',
      password: 'ValidPassword123!',
    };
    const dto = plainToInstance(LoginDto, rawInput);
    const errors = await validate(dto);

    const emailError = errors.find((e) => e.property === 'email');

    assertAndReport(
      {
        id: 'AUTH-07',
        name: 'Malformed email format validation',
        scenario: `email="${rawInput.email}"`,
        expected: 'Validation error: email must be an email',
        actual: `Validation constraint failed: ${JSON.stringify(emailError?.constraints)}`,
      },
      () => {
        expect(emailError).toBeDefined();
        expect(emailError?.constraints?.isEmail).toBeDefined();
      },
    );
  });

  // Negative Case 7: Register with short password (< 8 chars)
  it('AUTH-08 | Short registration password (< 8 chars) | Expected: Validation error', async () => {
    const rawInput = {
      name: 'Alex User',
      email: 'alex@orion.dev',
      password: 'short',
    };
    const dto = plainToInstance(RegisterDto, rawInput);
    const errors = await validate(dto);

    const passwordError = errors.find((e) => e.property === 'password');

    assertAndReport(
      {
        id: 'AUTH-08',
        name: 'Register password min length check',
        scenario: `password="${rawInput.password}" (length 5)`,
        expected:
          'Validation error: password must be longer than or equal to 8 characters',
        actual: `Validation constraint failed: ${passwordError?.constraints?.minLength}`,
      },
      () => {
        expect(passwordError).toBeDefined();
        expect(passwordError?.constraints?.minLength).toBeDefined();
      },
    );
  });

  // Negative Case 8: Register duplicate email
  it('AUTH-09 | Register duplicate email | Expected: 409 Conflict', async () => {
    const input: RegisterDto = {
      name: 'Existing User',
      email: 'existing@orion.dev',
      password: 'StrongPassword123!',
    };

    (authService.register as jest.Mock).mockRejectedValueOnce(
      new ConflictException('Email already in use'),
    );

    let error: any;
    try {
      await controller.register(input, mockResponse as Response);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'AUTH-09',
        name: 'Duplicate email registration rejection',
        scenario: `email=${input.email} already exists in DB`,
        expected:
          'HTTP 409 ConflictException with message "Email already in use"',
        actual: `HTTP ${error?.status || 409} Conflict, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe('Email already in use');
      },
    );
  });

  // Positive Case 7: Invitation Acceptance
  it('AUTH-10 | Valid invitation acceptance | Expected: Signs tokens, sets cookies, and redirects to dashboard', async () => {
    const inviteToken = 'valid.invite.token';
    const mockUser = {
      id: 'usr_invited_123',
      email: 'collab@orion.dev',
    };
    const mockTokens = {
      accessToken: 'access.jwt.collab',
      refreshToken: 'refresh.jwt.collab',
    };

    (inviteService.acceptInvite as jest.Mock).mockResolvedValueOnce({
      message: 'Invite accepted',
      email: mockUser.email,
      user: mockUser,
    });
    (authService.signTokens as jest.Mock).mockReturnValueOnce(mockTokens);

    await controller.acceptInvite(inviteToken, mockResponse as Response);

    assertAndReport(
      {
        id: 'AUTH-10',
        name: 'Invitation acceptance sets session cookies before dashboard redirect',
        scenario: `token=${inviteToken}, user=${mockUser.email}`,
        expected:
          'Signs tokens, sets session cookies, and redirects to http://localhost:3000/dashboard',
        actual:
          'signTokens called with user.id, setTokenCookies invoked, redirected to dashboard',
      },
      () => {
        expect(inviteService.acceptInvite).toHaveBeenCalledWith(inviteToken);
        expect(authService.signTokens).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
        );
        expect(authService.setTokenCookies).toHaveBeenCalledWith(
          mockResponse,
          mockTokens,
        );
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          'http://localhost:3000/dashboard',
        );
      },
    );
  });

  // Case 8: Replay Prevention - Existing member clicking consumed invite does not issue new tokens
  it('AUTH-11 | Existing member clicking consumed invite | Expected: No new tokens issued and redirects to dashboard', async () => {
    const inviteToken = 'consumed.invite.token';

    (inviteService.acceptInvite as jest.Mock).mockResolvedValueOnce({
      message: 'Already a member',
    });

    await controller.acceptInvite(inviteToken, mockResponse as Response);

    assertAndReport(
      {
        id: 'AUTH-11',
        name: 'Replay prevention: consumed invite does not issue session cookies',
        scenario: `token=${inviteToken}, already a member`,
        expected: 'No session cookies issued, redirect to dashboard',
        actual:
          'authService.signTokens and setTokenCookies not called, redirected to dashboard',
      },
      () => {
        expect(authService.signTokens).not.toHaveBeenCalled();
        expect(authService.setTokenCookies).not.toHaveBeenCalled();
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          'http://localhost:3000/dashboard',
        );
      },
    );
  });

  // Negative Case 9: Invalid or Expired Invite Link
  it('AUTH-12 | Invalid or expired invite token | Expected: BadRequestException', async () => {
    const inviteToken = 'expired.invite.token';

    (inviteService.acceptInvite as jest.Mock).mockRejectedValueOnce(
      new BadRequestException('Invalid or expired invite link'),
    );

    let error: any;
    try {
      await controller.acceptInvite(inviteToken, mockResponse as Response);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'AUTH-12',
        name: 'Invalid or expired invite link rejection',
        scenario: `token=${inviteToken}`,
        expected:
          'HTTP 400 BadRequestException with "Invalid or expired invite link"',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('Invalid or expired invite link');
        expect(authService.setTokenCookies).not.toHaveBeenCalled();
      },
    );
  });
});
