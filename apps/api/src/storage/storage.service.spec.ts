import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { DrizzleService } from '../db/drizzle.service';
import { assertAndReport } from '../../test/test-logger';

describe('StorageService', () => {
  let service: StorageService;
  let drizzle: any;

  beforeEach(() => {
    drizzle = {
      db: {
        select: jest.fn(),
        insert: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new StorageService(drizzle as DrizzleService);
  });

  // STOR-01: Non-existent project in storage
  it('STOR-01 | Storage bucket query for non-existent project | Expected: NotFoundException', async () => {
    const orgSlug = 'fake-org';
    const projectSlug = 'fake-proj';

    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        innerJoin: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      }),
    });

    let error: any;
    try {
      await service.getBuckets(orgSlug, projectSlug);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'STOR-01',
        name: 'Storage non-existent project lookup',
        scenario: 'orgSlug="fake-org", projectSlug="fake-proj"',
        expected: 'HTTP 404 NotFoundException("Project not found")',
        actual: `HTTP ${error?.status || 404} NotFound, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Project not found');
      },
    );
  });

  // STOR-02: Bucket creation with empty name
  it('STOR-02 | Create bucket with empty or whitespace name | Expected: BadRequestException', async () => {
    const orgSlug = 'valid-org';
    const projectSlug = 'valid-proj';

    // Mock project exists
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        innerJoin: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([{ id: 'proj_123' }]),
          }),
        }),
      }),
    });

    let error: any;
    try {
      await service.createBucket(orgSlug, projectSlug, '    ', 'public');
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'STOR-02',
        name: 'Empty bucket name validation',
        scenario: 'name="    " (whitespace only), access="public"',
        expected: 'HTTP 400 BadRequestException("Bucket name is required")',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('Bucket name is required');
      },
    );
  });

  // STOR-03: Save object in non-existent bucket
  it('STOR-03 | Save object in non-existent bucket | Expected: NotFoundException', async () => {
    const bucketId = 'bucket_missing';

    // Mock bucket lookup returning empty array
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    let error: any;
    try {
      await service.saveObject(bucketId, {
        name: 'document.pdf',
        size: 2048,
        type: 'application/pdf',
        utKey: 'key_abc',
        url: 'https://utfs.io/f/key_abc',
      });
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'STOR-03',
        name: 'Save object in non-existent bucket rejection',
        scenario: 'bucketId="bucket_missing", fileName="document.pdf"',
        expected: 'HTTP 404 NotFoundException("Bucket not found")',
        actual: `HTTP ${error?.status || 404} NotFound, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Bucket not found');
      },
    );
  });

  // STOR-04: BOLA: delete bucket in foreign project rejection
  it('STOR-04 | Delete bucket in foreign project | Expected: NotFoundException', async () => {
    const bucketId = 'bucket_foreign';
    const projectId = 'proj_own';

    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    let error: any;
    try {
      await service.deleteBucket(bucketId, projectId);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'STOR-04',
        name: 'Delete bucket cross-project BOLA rejection',
        scenario: 'bucketId="bucket_foreign", projectId="proj_own"',
        expected: 'HTTP 404 NotFoundException("Bucket not found")',
        actual: `HTTP ${error?.status || 404} NotFound, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Bucket not found');
      },
    );
  });

  // STOR-05: BOLA: delete object in foreign project rejection
  it('STOR-05 | Delete object in foreign project | Expected: NotFoundException', async () => {
    const objectId = 'obj_foreign';
    const projectId = 'proj_own';

    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        innerJoin: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      }),
    });

    let error: any;
    try {
      await service.deleteObject(objectId, projectId);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'STOR-05',
        name: 'Delete object cross-project BOLA rejection',
        scenario: 'objectId="obj_foreign", projectId="proj_own"',
        expected: 'HTTP 404 NotFoundException("File not found")',
        actual: `HTTP ${error?.status || 404} NotFound, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('File not found');
      },
    );
  });
});
