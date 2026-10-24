import { BadRequestException } from '@nestjs/common';
import { parseQueryParams, buildWhereClause } from './query-parser';
import { assertAndReport } from '../../test/test-logger';

describe('QueryParser & SQL Injection Defense', () => {
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
        scenario: 'select=id,name,email,created_at&status=eq.active&age=gte.18&order=created_at.desc&limit=50&offset=10',
        expected: 'ParsedQuery with 4 columns, 2 filters, order DESC, limit 50, offset 10',
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

  // Positive Case 2: buildWhereClause construction & escaping
  it('QUERY-04 | Build SQL WHERE clause with escaping | Expected: Safe escaped SQL string', () => {
    const filters = [
      { column: 'status', operator: '=', value: 'active' },
      { column: 'title', operator: 'ILIKE', value: "test's project" },
    ];

    const whereClause = buildWhereClause(filters);

    assertAndReport(
      {
        id: 'QUERY-04',
        name: 'WHERE clause construction with safe escaping',
        scenario: "filters=[status='active', title ILIKE 'test''s project']",
        expected: 'WHERE clause with single quotes escaped to \'\'',
        actual: `clause="${whereClause}"`,
      },
      () => {
        expect(whereClause).toContain('WHERE "status" = \'active\'');
        expect(whereClause).toContain('"title" ILIKE \'test\'\'s project\'');
      },
    );
  });
});
