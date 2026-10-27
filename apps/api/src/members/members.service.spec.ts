import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
import { DrizzleService } from '../db/drizzle.service';
import { assertAndReport } from '../../test/test-logger';

describe('MembersService', () => {
  let service: MembersService;
  let drizzle: any;

  beforeEach(() => {
    drizzle = {
      db: {
        select: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new MembersService(drizzle as DrizzleService);
  });

  // MEM-01: Demoting the last admin
  it('MEM-01 | Demoting the last admin in organization | Expected: BadRequestException', async () => {
    const orgSlug = 'acme-corp';
    const memberId = 'mem_admin_1';

    // Mock getMemberInOrg: target is admin
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        innerJoin: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest
              .fn()
              .mockResolvedValueOnce([
                { id: memberId, role: 'admin', orgId: 'org_123' },
              ]),
          }),
        }),
      }),
    });

    // Mock ensureNotLastAdmin: returns only 1 admin
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockResolvedValueOnce([{ id: memberId }]),
      }),
    });

    let error: any;
    try {
      await service.updateRole(orgSlug, memberId, { role: 'developer' });
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'MEM-01',
        name: 'Demote last admin rejection',
        scenario:
          'org="acme-corp", memberId="mem_admin_1", newRole="developer"',
        expected:
          'HTTP 400 BadRequestException("Cannot remove or demote the last admin of an organization")',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          'Cannot remove or demote the last admin of an organization',
        );
      },
    );
  });

  // MEM-02: Removing the last admin
  it('MEM-02 | Removing the last admin in organization | Expected: BadRequestException', async () => {
    const orgSlug = 'acme-corp';
    const memberId = 'mem_admin_1';

    // Mock getMemberInOrg: target is admin
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        innerJoin: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest
              .fn()
              .mockResolvedValueOnce([
                { id: memberId, role: 'admin', orgId: 'org_123' },
              ]),
          }),
        }),
      }),
    });

    // Mock ensureNotLastAdmin: returns only 1 admin
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockResolvedValueOnce([{ id: memberId }]),
      }),
    });

    let error: any;
    try {
      await service.removeMember(orgSlug, memberId);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'MEM-02',
        name: 'Remove last admin rejection',
        scenario: 'org="acme-corp", memberId="mem_admin_1"',
        expected:
          'HTTP 400 BadRequestException("Cannot remove or demote the last admin of an organization")',
        actual: `HTTP ${error?.status || 400} BadRequest, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          'Cannot remove or demote the last admin of an organization',
        );
      },
    );
  });

  // MEM-03: Updating role to developer succeeds when multiple admins exist
  it('MEM-03 | Demote admin when co-admin exists | Expected: Role updated to developer', async () => {
    const orgSlug = 'acme-corp';
    const memberId = 'mem_admin_1';

    // Mock getMemberInOrg: target is admin
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        innerJoin: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest
              .fn()
              .mockResolvedValueOnce([
                { id: memberId, role: 'admin', orgId: 'org_123' },
              ]),
          }),
        }),
      }),
    });

    // Mock ensureNotLastAdmin: 2 admins exist
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest
          .fn()
          .mockResolvedValueOnce([{ id: memberId }, { id: 'mem_admin_2' }]),
      }),
    });

    // Mock update: returns updated row
    const mockUpdated = { id: memberId, role: 'developer' };
    drizzle.db.update.mockReturnValueOnce({
      set: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([mockUpdated]),
        }),
      }),
    });

    const result = await service.updateRole(orgSlug, memberId, {
      role: 'developer',
    });

    assertAndReport(
      {
        id: 'MEM-03',
        name: 'Demote admin with co-admin present',
        scenario: 'org="acme-corp", memberId="mem_admin_1", coAdmins=2',
        expected: 'Updated member record returned with role="developer"',
        actual: `result.role="${result.role}"`,
      },
      () => {
        expect(result).toEqual(mockUpdated);
      },
    );
  });

  // MEM-04: Updating role for non-existent member
  it('MEM-04 | Update role for non-existent member | Expected: NotFoundException', async () => {
    const orgSlug = 'acme-corp';
    const memberId = 'non_existent_mem';

    // Mock getMemberInOrg: returns empty
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
      await service.updateRole(orgSlug, memberId, { role: 'admin' });
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'MEM-04',
        name: 'Update non-existent member role',
        scenario: 'memberId="non_existent_mem", newRole="admin"',
        expected: 'HTTP 404 NotFoundException("Member not found")',
        actual: `HTTP ${error?.status || 404} NotFound, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Member not found');
      },
    );
  });

  // MEM-05: Removing member soft-deletes with removedAt timestamp
  it('MEM-05 | Remove member soft-deletion | Expected: Success message returned', async () => {
    const orgSlug = 'acme-corp';
    const memberId = 'mem_dev_1';

    // Mock getMemberInOrg: developer member
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        innerJoin: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest
              .fn()
              .mockResolvedValueOnce([
                { id: memberId, role: 'developer', orgId: 'org_123' },
              ]),
          }),
        }),
      }),
    });

    drizzle.db.update.mockReturnValueOnce({
      set: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([{ id: memberId }]),
        }),
      }),
    });

    const result = await service.removeMember(orgSlug, memberId);

    assertAndReport(
      {
        id: 'MEM-05',
        name: 'Soft delete member removal',
        scenario: 'memberId="mem_dev_1", role="developer"',
        expected: '{ message: "Member removed" }',
        actual: `message="${result.message}"`,
      },
      () => {
        expect(result).toEqual({ message: 'Member removed' });
      },
    );
  });

  // MEM-06: BOLA/IDOR: Update role for member in different organization
  it('MEM-06 | Cross-org IDOR: Update role for member in different org | Expected: NotFoundException', async () => {
    const orgSlug = 'org-a';
    const memberIdFromOrgB = 'mem_from_org_b';

    // Mock getMemberInOrg: lookup scoped to orgSlug returns empty
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
      await service.updateRole(orgSlug, memberIdFromOrgB, {
        role: 'developer',
      });
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'MEM-06',
        name: 'Cross-organization member role update rejection',
        scenario: 'orgSlug="org-a", memberId="mem_from_org_b"',
        expected: 'HTTP 404 NotFoundException("Member not found")',
        actual: `HTTP ${error?.status || 404} NotFound, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Member not found');
      },
    );
  });

  // MEM-07: BOLA/IDOR: Remove member in different organization
  it('MEM-07 | Cross-org IDOR: Remove member in different org | Expected: NotFoundException', async () => {
    const orgSlug = 'org-a';
    const memberIdFromOrgB = 'mem_from_org_b';

    // Mock getMemberInOrg: lookup scoped to orgSlug returns empty
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
      await service.removeMember(orgSlug, memberIdFromOrgB);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'MEM-07',
        name: 'Cross-organization member removal rejection',
        scenario: 'orgSlug="org-a", memberId="mem_from_org_b"',
        expected: 'HTTP 404 NotFoundException("Member not found")',
        actual: `HTTP ${error?.status || 404} NotFound, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Member not found');
      },
    );
  });
});
