import { BadRequestException } from '@nestjs/common';
import { parseQueryParams, buildWhereClause } from './query-parser';
import { assertAndReport } from '../../test/test-logger';
import { PgDialect } from 'drizzle-orm/pg-core';

describe('QueryParser & SQL Injection Defense', () => {
  const dialect = new PgDialect();

  // Positive Case 1: Valid query parameters
  it('QUERY-01 | Parse valid query parameters | Expected: Structured ParsedQuery object', () => {
    const input = {
      select: 'id,name,email,created_at',
      status: 'eq.active',
      age: 'gte.18',
      order: 'created_at.desc',
      limit: '50',
      offset: '10',
    };

    const parsed = parseQueryParams(input);

    assertAndReport(
      {
        id: 'QUERY-01',
        name: 'Valid query parameter parsing',
        scenario:
          'select=id,name,email,created_at&status=eq.active&age=gte.18&order=created_at.desc&limit=50&offset=10',
        expected:
          'ParsedQuery with 4 columns, 2 filters, order DESC, limit 50, offset 10',
        actual: `select=[${parsed.select.join(', ')}], filters=${parsed.filters.length}, limit=${parsed.limit}, offset=${parsed.offset}`,
      },
      () => {
        expect(parsed.select).toEqual(['id', 'name', 'email', 'created_at']);
        expect(parsed.filters).toHaveLength(2);
        expect(parsed.filters[0]).toEqual({
          column: 'status',
          operator: '=',
          value: 'active',
        });
        expect(parsed.filters[1]).toEqual({
          column: 'age',
          operator: '>=',
          value: '18',
        });
        expect(parsed.orderBy).toEqual({
          column: 'created_at',
          direction: 'DESC',
        });
        expect(parsed.limit).toBe(50);
        expect(parsed.offset).toBe(10);
      },
    );
  });

  // Negative Case 1: SQL injection in select column
  it('QUERY-02 | SQL injection attempt in select column | Expected: Rejection (400)', () => {
    const maliciousInput = {
      select: 'id, name; DROP TABLE users; --',
    };

    let error: any;
    try {
      parseQueryParams(maliciousInput);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'QUERY-02',
        name: 'SQL injection in select rejected',
        scenario: `select="${maliciousInput.select}"`,
        expected: 'HTTP 400 BadRequestException with "Invalid select column"',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('Invalid select column');
      },
    );
  });

  // Negative Case 2: SQL injection in filter column key
  it('QUERY-03 | SQL injection attempt in filter column | Expected: Rejection (400)', () => {
    const maliciousInput = {
      'admin_flag" OR 1=1;--': 'eq.true',
    };

    let error: any;
    try {
      parseQueryParams(maliciousInput);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'QUERY-03',
        name: 'SQL injection in filter column rejected',
        scenario: 'filter_column="admin_flag\\" OR 1=1;--"',
        expected: 'HTTP 400 BadRequestException with "Invalid filter column"',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('Invalid filter column');
      },
    );
  });

  // Positive Case 2: buildWhereClause parameterized construction
  it('QUERY-04 | Build SQL WHERE clause with parameterization | Expected: Parameterized SQL with $1, $2 placeholders', () => {
    const filters = [
      { column: 'status', operator: '=', value: 'active' },
      { column: 'title', operator: 'ILIKE', value: "test's project" },
    ];

    const whereClause = buildWhereClause(filters);
    const compiled = dialect.sqlToQuery(whereClause!);

    assertAndReport(
      {
        id: 'QUERY-04',
        name: 'WHERE clause construction with safe parameterization',
        scenario: "filters=[status='active', title ILIKE 'test''s project']",
        expected: 'Parameterized SQL with $1, $2 placeholders and params array',
        actual: `sql="${compiled.sql}", params=${JSON.stringify(compiled.params)}`,
      },
      () => {
        expect(compiled.sql).toBe('"status" = $1 AND "title" ILIKE $2');
        expect(compiled.params).toEqual(['active', "test's project"]);
      },
    );
  });

  // Negative Case 3: SQL injection attempt in filter value safely parameterized
  it('QUERY-05 | SQL injection attempt in filter value | Expected: Parameterized as literal value without query breakout', () => {
    const maliciousInput = {
      username: "eq.admin' OR '1'='1",
    };

    const parsed = parseQueryParams(maliciousInput);
    const whereClause = buildWhereClause(parsed.filters);
    const compiled = dialect.sqlToQuery(whereClause!);

    assertAndReport(
      {
        id: 'QUERY-05',
        name: 'Filter value SQL injection parameterized safely',
        scenario: "username=eq.admin' OR '1'='1",
        expected:
          "Parameterized placeholder $1 with exact string value \"admin' OR '1'='1\"",
        actual: `sql="${compiled.sql}", params=${JSON.stringify(compiled.params)}`,
      },
      () => {
        expect(compiled.sql).toBe('"username" = $1');
        expect(compiled.params).toEqual(["admin' OR '1'='1"]);
      },
    );
  });

  // Positive Case 3: IS NULL and IS NOT NULL filter handling
  it('QUERY-06 | IS NULL filter handling | Expected: "column" IS NULL without parameterization', () => {
    const filters = [
      { column: 'deleted_at', operator: 'IS', value: 'null' },
      { column: 'verified_at', operator: 'IS', value: 'not null' },
    ];

    const whereClause = buildWhereClause(filters);
    const compiled = dialect.sqlToQuery(whereClause!);

    assertAndReport(
      {
        id: 'QUERY-06',
        name: 'IS NULL and IS NOT NULL operator handling',
        scenario: 'deleted_at IS null AND verified_at IS not null',
        expected: '"deleted_at" IS NULL AND "verified_at" IS NOT NULL',
        actual: `sql="${compiled.sql}", params=${JSON.stringify(compiled.params)}`,
      },
      () => {
        expect(compiled.sql).toBe(
          '"deleted_at" IS NULL AND "verified_at" IS NOT NULL',
        );
        expect(compiled.params).toEqual([]);
      },
    );
  });
});
