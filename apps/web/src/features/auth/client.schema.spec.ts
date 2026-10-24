import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from './client.schema';
import { assertAndReportWeb } from '../../test-logger';

describe('Frontend Form Zod Validation Schemas (Auth)', () => {
  // Positive Case 1
  it('WEB-VAL-01 | Valid login form data | Expected: Passes validation', () => {
    const validLogin = {
      email: 'student@college.edu',
      password: 'CollegePassword123!',
    };

    const result = loginSchema.safeParse(validLogin);

    assertAndReportWeb(
      {
        id: 'WEB-VAL-01',
        name: 'Login form schema validation success',
        scenario: `email=${validLogin.email}, password=******`,
        expected: 'safeParse success = true',
        actual: `success=${result.success}`,
      },
      () => {
        expect(result.success).toBe(true);
      },
    );
  });

  // Negative Case 1: Invalid email
  it('WEB-VAL-02 | Login form with invalid email | Expected: Rejection (Invalid email)', () => {
    const invalidLogin = {
      email: 'not-an-email',
      password: 'CollegePassword123!',
    };

    const result = loginSchema.safeParse(invalidLogin);

    assertAndReportWeb(
      {
        id: 'WEB-VAL-02',
        name: 'Login form email format check',
        scenario: `email="${invalidLogin.email}"`,
        expected: 'safeParse success = false, message="Invalid email"',
        actual: `success=${result.success}, errors=${!result.success ? result.error.issues[0]?.message : ''}`,
      },
      () => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid email');
        }
      },
    );
  });

  // Negative Case 2: Empty password
  it('WEB-VAL-03 | Login form with empty password | Expected: Rejection (Password is required)', () => {
    const invalidLogin = {
      email: 'student@college.edu',
      password: '',
    };

    const result = loginSchema.safeParse(invalidLogin);

    assertAndReportWeb(
      {
        id: 'WEB-VAL-03',
        name: 'Login form empty password check',
        scenario: 'password="" (empty string)',
        expected: 'safeParse success = false, message="Password is required"',
        actual: `success=${result.success}, errors=${!result.success ? result.error.issues[0]?.message : ''}`,
      },
      () => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Password is required');
        }
      },
    );
  });

  // Negative Case 3: Register short password
  it('WEB-VAL-04 | Register form with password < 8 chars | Expected: Rejection', () => {
    const invalidRegister = {
      name: 'Alex Student',
      email: 'alex@college.edu',
      password: 'short',
    };

    const result = registerSchema.safeParse(invalidRegister);

    assertAndReportWeb(
      {
        id: 'WEB-VAL-04',
        name: 'Register form password min length check',
        scenario: `password="${invalidRegister.password}" (length 5)`,
        expected: 'safeParse success = false, message contains "at least 8 characters"',
        actual: `success=${result.success}, message="${!result.success ? result.error.issues[0]?.message : ''}"`,
      },
      () => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain(
            'at least 8 characters',
          );
        }
      },
    );
  });

  // Positive Case 2: Valid register
  it('WEB-VAL-05 | Register form with valid data | Expected: Passes validation', () => {
    const validRegister = {
      name: 'Alex Student',
      email: 'alex@college.edu',
      password: 'StrongStudentPassword123!',
    };

    const result = registerSchema.safeParse(validRegister);

    assertAndReportWeb(
      {
        id: 'WEB-VAL-05',
        name: 'Register form schema validation success',
        scenario: `name=${validRegister.name}, email=${validRegister.email}`,
        expected: 'safeParse success = true',
        actual: `success=${result.success}`,
      },
      () => {
        expect(result.success).toBe(true);
      },
    );
  });
});
