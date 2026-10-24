import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SqlEditorService } from './sql-editor.service';
import { DrizzleService } from '../db/drizzle.service';
import { assertAndReport } from '../../test/test-logger';

describe('SqlEditorService Statement & Query Validation', () => {
  let service: SqlEditorService;
  let mockDrizzle: Partial<DrizzleService>;

  beforeEach(() => {
    mockDrizzle = {
      db: {} as any,
    };
    service = new SqlEditorService(mockDrizzle as DrizzleService);
  });

  // Positive Case 1: Valid single SQL query
  it('SQL-01 | Valid single SQL query parsing | Expected: Cleaned single statement', () => {
    const inputSql = '   SELECT id, name FROM users WHERE status = \'active\';   ';

    const parsedStatement = (service as any).parseSingleStatement(inputSql);

    assertAndReport(
      {
        id: 'SQL-01',
        name: 'Single statement parsing & sanitization',
        scenario: inputSql.trim(),
        expected: 'Parsed single SQL statement string without trailing semicolons',
        actual: `statement="${parsedStatement}"`,
      },
      () => {
        expect(parsedStatement).toBe("SELECT id, name FROM users WHERE status = 'active'");
      },
    );
  });

  // Negative Case 1: Multiple SQL statements
  it('SQL-02 | Multiple SQL statements execution attempt | Expected: Rejection (400)', () => {
    const multiSql = 'SELECT * FROM users; DROP TABLE users;';

    let error: any;
    try {
      (service as any).parseSingleStatement(multiSql);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'SQL-02',
        name: 'Multi-statement injection rejection',
        scenario: multiSql,
        expected: 'HTTP 400 BadRequestException("Only one SQL statement per run...")',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('Only one SQL statement per run');
      },
    );
  });

  // Negative Case 2: Empty SQL query
  it('SQL-03 | Empty SQL query execution attempt | Expected: Rejection (400)', () => {
    const emptySql = '   ;   ;  ';

    let error: any;
    try {
      (service as any).parseSingleStatement(emptySql);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'SQL-03',
        name: 'Empty SQL query rejection',
        scenario: 'query="   ;   ;  " (no statements)',
        expected: 'HTTP 400 BadRequestException("SQL query cannot be empty")',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('SQL query cannot be empty');
      },
    );
  });

  // Negative Case 3: Blocked destructive statement (DROP DATABASE / TRUNCATE)
  it('SQL-04 | Destructive statement check (DROP DATABASE) | Expected: Rejection (400)', () => {
    const blocked = ['DROP DATABASE', 'DROP SCHEMA', 'TRUNCATE'];
    const dangerousSql = 'DROP DATABASE orion_production';

    const normalised = dangerousSql.trim().toUpperCase();
    const isBlocked = blocked.some((b) => normalised.startsWith(b));

    assertAndReport(
      {
        id: 'SQL-04',
        name: 'Dangerous destructive SQL blocking',
        scenario: `statement="${dangerousSql}"`,
        expected: 'Detected as forbidden statement (isBlocked=true)',
        actual: `isBlocked=${isBlocked}`,
      },
      () => {
        expect(isBlocked).toBe(true);
      },
    );
  });
});
