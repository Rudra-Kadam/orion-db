import { BadRequestException } from '@nestjs/common';
import { ProjectApiService } from './project-api.service';
import { DrizzleService } from '../db/drizzle.service';
import { PgDialect } from 'drizzle-orm/pg-core';
import { assertAndReport } from '../../test/test-logger';

describe('ProjectApiService & Parameterized Queries', () => {
  let service: ProjectApiService;
  let drizzle: any;
  const dialect = new PgDialect();

  beforeEach(() => {
    drizzle = {
      db: {
        select: jest.fn(),
        execute: jest.fn(),
      },
    };
    service = new ProjectApiService(drizzle as DrizzleService);
  });

  // PRAPI-01: Parameterized getRows query execution
  it('PRAPI-01 | Parameterized getRows query execution | Expected: Executed query is parameterized SQL', async () => {
    // Mock resolveProjectSchema
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          limit: jest
            .fn()
            .mockResolvedValueOnce([
              { dbSchema: 'proj_schema_1', slug: 'demo-proj' },
            ]),
        }),
      }),
    });

    let executedQuery: any;
    drizzle.db.execute.mockImplementationOnce((query: any) => {
      executedQuery = query;
      return Promise.resolve({ rows: [{ id: '1', title: 'Test Row' }] });
    });

    const rows = await service.getRows('proj_1', 'demo-proj', 'posts', {
      select: 'id,title',
      status: 'eq.published',
      limit: '10',
      offset: '0',
    });

    const compiled = dialect.sqlToQuery(executedQuery);

    assertAndReport(
      {
        id: 'PRAPI-01',
        name: 'getRows uses parameterized SQL',
        scenario: 'getRows(posts, select=id,title, status=eq.published)',
        expected:
          'Parameterized query with $1 for status filter and $2, $3 for limit/offset',
        actual: `sql="${compiled.sql}", params=${JSON.stringify(compiled.params)}`,
      },
      () => {
        expect(rows).toEqual([{ id: '1', title: 'Test Row' }]);
        expect(compiled.sql).toContain('SELECT "id", "title"');
        expect(compiled.sql).toContain('FROM "proj_schema_1"."posts"');
        expect(compiled.sql).toContain('WHERE "status" = $1');
        expect(compiled.params).toEqual(['published', 10, 0]);
      },
    );
  });

  // PRAPI-02: Parameterized insertRow query execution
  it('PRAPI-02 | Parameterized insertRow query execution | Expected: Parameters separated, jsonb cast for objects', async () => {
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          limit: jest
            .fn()
            .mockResolvedValueOnce([
              { dbSchema: 'proj_schema_1', slug: 'demo-proj' },
            ]),
        }),
      }),
    });

    let executedQuery: any;
    drizzle.db.execute.mockImplementationOnce((query: any) => {
      executedQuery = query;
      return Promise.resolve({
        rows: [
          { id: 'row_1', name: "Alice's Project", meta: { role: 'admin' } },
        ],
      });
    });

    const inserted = await service.insertRow('proj_1', 'demo-proj', 'users', {
      name: "Alice's Project",
      age: 28,
      meta: { role: 'admin' },
    });

    const compiled = dialect.sqlToQuery(executedQuery);

    assertAndReport(
      {
        id: 'PRAPI-02',
        name: 'insertRow uses parameterized SQL with jsonb support',
        scenario: 'insertRow with name with quotes, number, and object payload',
        expected: 'INSERT query with $1, $2, $3::jsonb and separated params',
        actual: `sql="${compiled.sql}", params=${JSON.stringify(compiled.params)}`,
      },
      () => {
        expect(inserted.id).toBe('row_1');
        expect(compiled.sql).toContain(
          'INSERT INTO "proj_schema_1"."users" ("name", "age", "meta")',
        );
        expect(compiled.sql).toContain('VALUES ($1, $2, $3::jsonb)');
        expect(compiled.params).toEqual([
          "Alice's Project",
          28,
          '{"role":"admin"}',
        ]);
      },
    );
  });

  // PRAPI-03: Parameterized updateRow query execution
  it('PRAPI-03 | Parameterized updateRow query execution | Expected: Parameterized SET clause and WHERE pk', async () => {
    // Mock resolveProjectSchema
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          limit: jest
            .fn()
            .mockResolvedValueOnce([
              { dbSchema: 'proj_schema_1', slug: 'demo-proj' },
            ]),
        }),
      }),
    });

    // Mock getPrimaryKeyColumn
    drizzle.db.execute.mockResolvedValueOnce({
      rows: [{ column_name: 'id' }],
    });

    let executedQuery: any;
    drizzle.db.execute.mockImplementationOnce((query: any) => {
      executedQuery = query;
      return Promise.resolve({
        rows: [{ id: 'row_123', status: 'archived' }],
      });
    });

    const updated = await service.updateRow(
      'proj_1',
      'demo-proj',
      'posts',
      'row_123',
      { status: 'archived' },
    );

    const compiled = dialect.sqlToQuery(executedQuery);

    assertAndReport(
      {
        id: 'PRAPI-03',
        name: 'updateRow uses parameterized SET and WHERE pk',
        scenario: 'updateRow(posts, id=row_123, status=archived)',
        expected: 'UPDATE query with "status" = $1 WHERE "id" = $2',
        actual: `sql="${compiled.sql}", params=${JSON.stringify(compiled.params)}`,
      },
      () => {
        expect(updated.id).toBe('row_123');
        expect(compiled.sql).toContain('UPDATE "proj_schema_1"."posts"');
        expect(compiled.sql).toContain('SET "status" = $1');
        expect(compiled.sql).toContain('WHERE "id" = $2');
        expect(compiled.params).toEqual(['archived', 'row_123']);
      },
    );
  });

  // PRAPI-04: Parameterized deleteRow query execution
  it('PRAPI-04 | Parameterized deleteRow query execution | Expected: Parameterized DELETE WHERE pk', async () => {
    // Mock resolveProjectSchema
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          limit: jest
            .fn()
            .mockResolvedValueOnce([
              { dbSchema: 'proj_schema_1', slug: 'demo-proj' },
            ]),
        }),
      }),
    });

    // Mock getPrimaryKeyColumn
    drizzle.db.execute.mockResolvedValueOnce({
      rows: [{ column_name: 'id' }],
    });

    let executedQuery: any;
    drizzle.db.execute.mockImplementationOnce((query: any) => {
      executedQuery = query;
      return Promise.resolve({
        rows: [{ id: 'row_123' }],
      });
    });

    const deleted = await service.deleteRow(
      'proj_1',
      'demo-proj',
      'posts',
      'row_123',
    );

    const compiled = dialect.sqlToQuery(executedQuery);

    assertAndReport(
      {
        id: 'PRAPI-04',
        name: 'deleteRow uses parameterized WHERE pk',
        scenario: 'deleteRow(posts, id=row_123)',
        expected: 'DELETE query WHERE "id" = $1',
        actual: `sql="${compiled.sql}", params=${JSON.stringify(compiled.params)}`,
      },
      () => {
        expect(deleted.id).toBe('row_123');
        expect(compiled.sql).toContain('DELETE FROM "proj_schema_1"."posts"');
        expect(compiled.sql).toContain('WHERE "id" = $1');
        expect(compiled.params).toEqual(['row_123']);
      },
    );
  });

  // PRAPI-05: SQL injection rejection in tableName identifier
  it('PRAPI-05 | SQL injection attempt in tableName | Expected: BadRequestException', async () => {
    let error: any;
    try {
      await service.getRows(
        'proj_1',
        'demo-proj',
        'posts; DROP TABLE users; --',
        {},
      );
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'PRAPI-05',
        name: 'SQL injection in tableName rejected',
        scenario: 'tableName="posts; DROP TABLE users; --"',
        expected: 'HTTP 400 BadRequestException with "Invalid table name"',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('Invalid table name');
      },
    );
  });
});
