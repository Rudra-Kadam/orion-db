import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProjectsService } from './projects.service';
import { DrizzleService } from '../db/drizzle.service';
import { assertAndReport } from '../../test/test-logger';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let drizzle: any;
  let jwtService: any;
  let configService: any;

  beforeEach(() => {
    drizzle = {
      db: {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        execute: jest.fn(),
      },
    };
    jwtService = {
      sign: jest.fn(),
    };
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'PROJECT_JWT_SECRET') return 'mock-project-jwt-secret';
        if (key === 'API_URL') return 'http://localhost:3001/api';
        return null;
      }),
    };

    service = new ProjectsService(
      drizzle as DrizzleService,
      jwtService as JwtService,
      configService as ConfigService,
    );
  });

  // PROJ-01: Non-existent org in createProject
  it('PROJ-01 | Create project in non-existent organization | Expected: NotFoundException', async () => {
    const orgSlug = 'missing-org';

    // Mock org lookup returning empty array
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    let error: any;
    try {
      await service.createProject(orgSlug, { name: 'My New App' });
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'PROJ-01',
        name: 'Create project in non-existent organization',
        scenario: 'orgSlug="missing-org", projectName="My New App"',
        expected: 'HTTP 404 NotFoundException("Organization not found")',
        actual: `HTTP ${error?.status || 404} NotFound, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Organization not found');
      },
    );
  });

  // PROJ-02: Non-existent project lookup
  it('PROJ-02 | Lookup non-existent project by slug | Expected: NotFoundException', async () => {
    const orgSlug = 'existing-org';
    const projectSlug = 'non-existent-proj';
    const userId = 'usr_123';

    // Mock project lookup returning empty array
    drizzle.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce({
        innerJoin: jest.fn().mockReturnValueOnce({
          innerJoin: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce([]),
            }),
          }),
        }),
      }),
    });

    let error: any;
    try {
      await service.getProjectBySlug(orgSlug, projectSlug, userId);
    } catch (err) {
      error = err;
    }

    assertAndReport(
      {
        id: 'PROJ-02',
        name: 'Non-existent project lookup',
        scenario: 'orgSlug="existing-org", projectSlug="non-existent-proj"',
        expected: 'HTTP 404 NotFoundException("Project not found")',
        actual: `HTTP ${error?.status || 404} NotFound, message="${error?.message}"`,
      },
      () => {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Project not found');
      },
    );
  });

  // PROJ-03: Project slug generation format
  it('PROJ-03 | Project slug generation formatting | Expected: slugified with random hex suffix', () => {
    const name = 'Alpha Core Analytics Engine!';
    const slug = (service as any).generateProjectSlug(name);

    assertAndReport(
      {
        id: 'PROJ-03',
        name: 'Project slug generation with hex suffix',
        scenario: 'name="Alpha Core Analytics Engine!"',
        expected: 'Slug starts with "alpha-core-analytics-engine-" followed by 6 hex chars',
        actual: `slug="${slug}"`,
      },
      () => {
        expect(slug).toMatch(/^alpha-core-analytics-engine-[a-f0-9]{6}$/);
      },
    );
  });

  // PROJ-04: Sign project API key
  it('PROJ-04 | Sign Project API key | Expected: Signed with PROJECT_JWT_SECRET', () => {
    const projectId = 'proj_xyz987';
    const role = 'anon';

    jwtService.sign.mockReturnValueOnce('mock.signed.project.token');

    const token = (service as any).signProjectKey(projectId, role);

    assertAndReport(
      {
        id: 'PROJ-04',
        name: 'Project key signing with role',
        scenario: 'projectId="proj_xyz987", role="anon"',
        expected: 'jwtService.sign invoked with {projectId, role} and secret',
        actual: `token="${token}"`,
      },
      () => {
        expect(jwtService.sign).toHaveBeenCalledWith(
          { projectId, role },
          expect.objectContaining({
            secret: 'mock-project-jwt-secret',
            expiresIn: '100y',
          }),
        );
        expect(token).toBe('mock.signed.project.token');
      },
    );
  });
});
