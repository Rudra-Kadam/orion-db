import { describe, it, expect } from 'vitest';
import {
  createTableSchema,
  addColumnSchema,
} from './client.schema';
import { assertAndReportWeb } from '../../test-logger';

describe('Frontend Form Zod Validation Schemas (Table Editor)', () => {
  // WEB-TBL-01: Valid table creation
  it('WEB-TBL-01 | Valid table creation schema data | Expected: Passes validation', () => {
    const input = {
      name: 'customers_archive',
      columns: [
        {
          name: 'id',
          type: 'uuid' as const,
          isNullable: false,
          isPrimaryKey: true,
          defaultValue: 'gen_random_uuid()',
        },
        {
          name: 'email',
          type: 'text' as const,
          isNullable: false,
          isPrimaryKey: false,
        },
      ],
    };

    const result = createTableSchema.safeParse(input);

    assertAndReportWeb(
      {
        id: 'WEB-TBL-01',
        name: 'Valid table creation schema validation',
        scenario: 'tableName="customers_archive", columns=2 (with uuid PK)',
        expected: 'Zod safeParse success = true',
        actual: `success=${result.success}`,
      },
      () => {
        expect(result.success).toBe(true);
      },
    );
  });

  // WEB-TBL-02: Zero columns rejection
  it('WEB-TBL-02 | Reject table creation with zero columns | Expected: Rejection (At least one column required)', () => {
    const input = {
      name: 'empty_table',
      columns: [],
    };

    const result = createTableSchema.safeParse(input);

    assertAndReportWeb(
      {
        id: 'WEB-TBL-02',
        name: 'Empty columns array rejection',
        scenario: 'tableName="empty_table", columns=[]',
        expected: 'Zod safeParse success = false, message="At least one column required"',
        actual: `success=${result.success}, error="${!result.success ? result.error.issues[0]?.message : ''}"`,
      },
      () => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('At least one column required');
        }
      },
    );
  });

  // WEB-TBL-03: Empty table name
  it('WEB-TBL-03 | Reject empty table name | Expected: Rejection (Table name is required)', () => {
    const input = {
      name: '',
      columns: [
        {
          name: 'id',
          type: 'uuid' as const,
          isNullable: false,
          isPrimaryKey: true,
        },
      ],
    };

    const result = createTableSchema.safeParse(input);

    assertAndReportWeb(
      {
        id: 'WEB-TBL-03',
        name: 'Empty table name rejection',
        scenario: 'tableName="" (empty)',
        expected: 'Zod safeParse success = false, message="Table name is required"',
        actual: `success=${result.success}, error="${!result.success ? result.error.issues[0]?.message : ''}"`,
      },
      () => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Table name is required');
        }
      },
    );
  });

  // WEB-TBL-04: Add column regex identifier check
  it('WEB-TBL-04 | Add column rejects invalid SQL identifier | Expected: Rejection (Invalid column name)', () => {
    const input = {
      tableName: 'customers',
      name: '123_invalid_col',
      type: 'text' as const,
    };

    const result = addColumnSchema.safeParse(input);

    assertAndReportWeb(
      {
        id: 'WEB-TBL-04',
        name: 'Invalid column identifier rejection',
        scenario: 'columnName="123_invalid_col" (starts with digits)',
        expected: 'Zod safeParse success = false, message="Invalid column name"',
        actual: `success=${result.success}, error="${!result.success ? result.error.issues[0]?.message : ''}"`,
      },
      () => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid column name');
        }
      },
    );
  });

  // WEB-TBL-05: Add column accepts valid types
  it('WEB-TBL-05 | Add column accepts valid registered types | Expected: Passes validation', () => {
    const input = {
      tableName: 'orders',
      name: 'total_amount',
      type: 'numeric' as const,
      defaultValue: '0.00',
    };

    const result = addColumnSchema.safeParse(input);

    assertAndReportWeb(
      {
        id: 'WEB-TBL-05',
        name: 'Valid column type and name validation',
        scenario: 'tableName="orders", columnName="total_amount", type="numeric"',
        expected: 'Zod safeParse success = true',
        actual: `success=${result.success}`,
      },
      () => {
        expect(result.success).toBe(true);
      },
    );
  });
});
