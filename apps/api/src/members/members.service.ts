import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { orgMembers, organizations, users } from '../db/schema';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class MembersService {
  constructor(private drizzle: DrizzleService) {}

  async getMembers(orgSlug: string) {
    return this.drizzle.db
      .select({
        id: orgMembers.id,
        role: orgMembers.role,
        createdAt: orgMembers.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(orgMembers)
      .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
      .innerJoin(users, eq(orgMembers.userId, users.id))
      .where(
        and(eq(organizations.slug, orgSlug), isNull(orgMembers.removedAt)),
      );
  }

  private async getMemberInOrg(orgSlug: string, memberId: string) {
    const [member] = await this.drizzle.db
      .select({
        id: orgMembers.id,
        role: orgMembers.role,
        orgId: orgMembers.orgId,
      })
      .from(orgMembers)
      .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
      .where(
        and(
          eq(orgMembers.id, memberId),
          eq(organizations.slug, orgSlug),
          isNull(orgMembers.removedAt),
        ),
      )
      .limit(1);

    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  private async ensureNotLastAdmin(orgId: string) {
    const admins = await this.drizzle.db
      .select({ id: orgMembers.id })
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, orgId),
          eq(orgMembers.role, 'admin'),
          isNull(orgMembers.removedAt),
        ),
      );

    if (admins.length <= 1) {
      throw new BadRequestException(
        'Cannot remove or demote the last admin of an organization',
      );
    }
  }

  async updateRole(orgSlug: string, memberId: string, dto: UpdateRoleDto) {
    const member = await this.getMemberInOrg(orgSlug, memberId);

    if (member.role === 'admin' && dto.role === 'developer') {
      await this.ensureNotLastAdmin(member.orgId);
    }

    const [updated] = await this.drizzle.db
      .update(orgMembers)
      .set({ role: dto.role })
      .where(
        and(eq(orgMembers.id, member.id), eq(orgMembers.orgId, member.orgId)),
      )
      .returning();

    if (!updated) throw new NotFoundException('Member not found');
    return updated;
  }

  async removeMember(orgSlug: string, memberId: string) {
    const member = await this.getMemberInOrg(orgSlug, memberId);

    if (member.role === 'admin') {
      await this.ensureNotLastAdmin(member.orgId);
    }

    const [updated] = await this.drizzle.db
      .update(orgMembers)
      .set({ removedAt: new Date() })
      .where(
        and(eq(orgMembers.id, member.id), eq(orgMembers.orgId, member.orgId)),
      )
      .returning();

    if (!updated) throw new NotFoundException('Member not found');
    return { message: 'Member removed' };
  }
}
