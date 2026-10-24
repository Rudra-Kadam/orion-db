import { describe, it, expect } from 'vitest';
import { createProjectSchema } from './client.schema';
import { assertAndReportWeb } from '../../test-logger';

describe('Frontend Form Zod Validation Schemas (Projects)', () => {
  // Positive Case 1
  it('WEB-PROJ-01 | Valid project creation form data | Expected: Passes validation', () => {
    const input = { name: 'Apollo Analytics Engine' };
    const result = createProjectSchema.safeParse(input);

    assertAndReportWeb(
      {
        id: 'WEB-PROJ-01',
        name: 'Project form valid name check',
        scenario: `name="${input.name}"`,
        expected: 'safeParse success = true',
        actual: `success=${result.success}`,
      },
      () => {
        expect(result.success).toBe(true);
      },
    );
  });

  // Negative Case 1: Name too short (< 2 chars)
  it('WEB-PROJ-02 | Project name too short (< 2 chars) | Expected: Rejection (at least 2 characters)', () => {
    const input = { name: 'A' };
    const result = createProjectSchema.safeParse(input);

    assertAndReportWeb(
      {
        id: 'WEB-PROJ-02',
        name: 'Project name min length check',
        scenario: `name="${input.name}" (1 char)`,
        expected: 'safeParse success = false, message="Name must be at least 2 characters"',
        actual: `success=${result.success}, error="${!result.success ? result.error.issues[0]?.message : ''}"`,
      },
      () => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'Name must be at least 2 characters',
          );
        }
      },
    );
  });

  // Negative Case 2: Name too long (> 50 chars)
  it('WEB-PROJ-03 | Project name too long (> 50 chars) | Expected: Rejection (at most 50 characters)', () => {
    const input = {
      name: 'Super Long Project Name That Exceeds The Maximum Permitted Fifty Characters Threshold Limit',
    };
    const result = createProjectSchema.safeParse(input);

    assertAndReportWeb(
      {
        id: 'WEB-PROJ-03',
        name: 'Project name max length check',
        scenario: `name length=${input.name.length} (> 50 chars)`,
        expected: 'safeParse success = false, message="Name must be at most 50 characters"',
        actual: `success=${result.success}, error="${!result.success ? result.error.issues[0]?.message : ''}"`,
      },
      () => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'Name must be at most 50 characters',
          );
        }
      },
    );
  });
});
