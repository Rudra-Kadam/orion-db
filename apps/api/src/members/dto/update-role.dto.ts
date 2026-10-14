import { IsEnum } from 'class-validator';
import { ORG_ROLES } from '@orion/constants';
import type { OrgRole } from '@orion/types';

export class UpdateRoleDto {
  @IsEnum(ORG_ROLES)
  role!: OrgRole;
}
