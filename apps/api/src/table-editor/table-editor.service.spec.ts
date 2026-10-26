import { BadRequestException } from '@nestjs/common';
import { TableEditorService } from './table-editor.service';
import { DrizzleService } from '../db/drizzle.service';
import { assertAndReport } from '../../test/test-logger';

describe('TableEditorService', () => {
  let service: TableEditorService;
  let drizzle: any;

  beforeEach(() => {
    drizzle = {
      db: {
        execute: jest.fn(),
        select: jest.fn(),
      },
    };
    service = new TableEditorService(drizzle as DrizzleService);
  });

  // TBL-01: Valid table identifier
  it('TBL-01 | Valid table name identifier | Expected: Validation passes', () => {
    const validName = 'analytics_events_2026';
    let passed = false;

    try {
      (service as any).assertSafeIdentifier(validName, 'table name');
      passed = true;
    } catch {
      passed = false;
    }

    assertAndReport(
      {
        id: 'TBL-01',
        name: 'Valid table identifier validation',
        scenario: 'tableName="analytics_events_2026"',
        expected: 'Identifier accepted without exception',
        actual: `passed=${passed}`,
      },
      () => {
        expect(passed).toBe(true);
      },
    );
  });

  // TBL-02: SQL injection in table name
  it('TBL-02 | SQL injection in table name identifier | Expected: BadRequestException', () => {
    const maliciousName = 'users; DROP TABLE audit_log; --';
    let error: any;

    try {
      (service as any).assertSafeIdentifier(maliciousName, 'table name');
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'TBL-02',
        name: 'SQL injection in table name rejected',
        scenario: 'tableName="users; DROP TABLE audit_log; --"',
        expected: 'HTTP 400 BadRequestException("Invalid table name: users; DROP TABLE audit_log; --")',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('Invalid table name: users; DROP TABLE audit_log; --');
      },
    );
  });

  // TBL-03: Invalid column name starting with digit
  it('TBL-03 | Column name starting with number | Expected: BadRequestException', () => {
    const invalidCol = '123_invalid_column';
    let error: any;

    try {
      (service as any).assertSafeIdentifier(invalidCol, 'column name');
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'TBL-03',
        name: 'Invalid column identifier rejected',
        scenario: 'columnName="123_invalid_column"',
        expected: 'HTTP 400 BadRequestException("Invalid column name: 123_invalid_column")',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('Invalid column name: 123_invalid_column');
      },
    );
  });

  // TBL-04: Column type mapping
  it('TBL-04 | Postgres internal data types mapped to frontend column types | Expected: Accurate mapping', () => {
    const mapPg = (type: string) => (service as any).mapPgTypeToColumnType(type);

    const textMapped = mapPg('character varying');
    const timestampMapped = mapPg('timestamp with time zone');
    const uuidMapped = mapPg('uuid');
    const integerMapped = mapPg('integer');

    assertAndReport(
      {
        id: 'TBL-04',
        name: 'PostgreSQL type to Orion ColumnType mapping',
        scenario: 'pgTypes=["character varying", "timestamp with time zone", "uuid", "integer"]',
        expected: 'Mapped to ["text", "timestamp", "uuid", "integer"]',
        actual: `Mapped to [${textMapped}, ${timestampMapped}, ${uuidMapped}, ${integerMapped}]`,
      },
      () => {
        expect(textMapped).toBe('text');
        expect(timestampMapped).toBe('timestamp');
        expect(uuidMapped).toBe('uuid');
        expect(integerMapped).toBe('integer');
      },
    );
  });

  // TBL-05: Safe default formatting for SQL functions and string literals
  it('TBL-05 | Safe default value formatting for SQL functions vs literals | Expected: Correctly escaped or preserved', () => {
    const format = (val: string, type: any) => (service as any).formatDefault(val, type);

    const nowDefault = format('now()', 'timestamp');
    const uuidDefault = format('gen_random_uuid()', 'uuid');
    const literalDefault = format("active's status", 'text');
    const emptyDefault = format('   ', 'text');

    assertAndReport(
      {
        id: 'TBL-05',
        name: 'Default value SQL formatting & escaping',
        scenario: 'values=["now()", "gen_random_uuid()", "active\'s status", "   "]',
        expected: 'now() and gen_random_uuid() preserved, string literals escaped to \'\'',
        actual: `[${nowDefault}, ${uuidDefault}, ${literalDefault}, "${emptyDefault}"]`,
      },
      () => {
        expect(nowDefault).toBe('now()');
        expect(uuidDefault).toBe('gen_random_uuid()');
        expect(literalDefault).toBe("'active''s status'");
        expect(emptyDefault).toBe('');
      },
    );
  });
});
