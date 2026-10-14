import { SetMetadata } from '@nestjs/common';
import type { OrgRole } from '@orion/types';

export const ORG_ROLE_KEY = 'orgRole';

export const RequireOrgRole = (role: OrgRole) =>
  SetMetadata(ORG_ROLE_KEY, role);
