import { IsEnum } from 'class-validator';
import { ORG_ROLES } from '@supavolt/constants';
import type { OrgRole } from '@supavolt/types';

export class UpdateRoleDto {
  @IsEnum(ORG_ROLES)
  role!: OrgRole;
}
