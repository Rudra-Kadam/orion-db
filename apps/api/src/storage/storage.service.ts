import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';
import { DrizzleService } from '../db/drizzle.service';
import {
  projects,
  organizations,
  storageBuckets,
  storageObjects,
} from '../db/schema';
import type { BucketAccess } from '@orion/types';

@Injectable()
export class StorageService {
  private utapi = new UTApi();

  constructor(private drizzle: DrizzleService) {}

  async getProject(orgSlug: string, projectSlug: string) {
    const [row] = await this.drizzle.db
      .select({ id: projects.id })
      .from(projects)
      .innerJoin(organizations, eq(projects.orgId, organizations.id))
      .where(
        and(eq(organizations.slug, orgSlug), eq(projects.slug, projectSlug)),
      )
      .limit(1);

    if (!row) throw new NotFoundException('Project not found');
    return row;
  }

  async getBucket(projectId: string, bucketId: string) {
    const [bucket] = await this.drizzle.db
      .select()
      .from(storageBuckets)
      .where(
        and(
          eq(storageBuckets.id, bucketId),
          eq(storageBuckets.projectId, projectId),
        ),
      )
      .limit(1);

    if (!bucket) throw new NotFoundException('Bucket not found');
    return bucket;
  }

  async getObject(projectId: string, objectId: string) {
    const [row] = await this.drizzle.db
      .select({
        id: storageObjects.id,
        bucketId: storageObjects.bucketId,
        name: storageObjects.name,
        size: storageObjects.size,
        mimeType: storageObjects.mimeType,
        utKey: storageObjects.utKey,
        url: storageObjects.url,
        createdAt: storageObjects.createdAt,
      })
      .from(storageObjects)
      .innerJoin(storageBuckets, eq(storageObjects.bucketId, storageBuckets.id))
      .where(
        and(
          eq(storageObjects.id, objectId),
          eq(storageBuckets.projectId, projectId),
        ),
      )
      .limit(1);

    if (!row) throw new NotFoundException('File not found');
    return row;
  }

  async getBuckets(orgSlug: string, projectSlug: string) {
    const project = await this.getProject(orgSlug, projectSlug);
    return this.drizzle.db
      .select()
      .from(storageBuckets)
      .where(eq(storageBuckets.projectId, project.id));
  }

  async createBucket(
    orgSlug: string,
    projectSlug: string,
    name: string,
    access: BucketAccess,
  ) {
    const project = await this.getProject(orgSlug, projectSlug);

    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Bucket name is required');
    }

    const [bucket] = await this.drizzle.db
      .insert(storageBuckets)
      .values({ projectId: project.id, name: trimmed, access })
      .returning();

    return bucket;
  }

  async deleteBucket(bucketId: string, projectId?: string) {
    if (projectId) {
      await this.getBucket(projectId, bucketId);
    }

    const objects = await this.drizzle.db
      .select({ utKey: storageObjects.utKey })
      .from(storageObjects)
      .where(eq(storageObjects.bucketId, bucketId));

    if (objects.length > 0) {
      await this.utapi.deleteFiles(objects.map((o) => o.utKey));
    }

    await this.drizzle.db
      .delete(storageBuckets)
      .where(
        projectId
          ? and(
              eq(storageBuckets.id, bucketId),
              eq(storageBuckets.projectId, projectId),
            )
          : eq(storageBuckets.id, bucketId),
      );

    return { message: 'Bucket deleted' };
  }

  async getObjects(bucketId: string, projectId?: string) {
    if (projectId) {
      await this.getBucket(projectId, bucketId);
    }

    return this.drizzle.db
      .select()
      .from(storageObjects)
      .where(eq(storageObjects.bucketId, bucketId));
  }

  async saveObject(
    bucketId: string,
    file: {
      name: string;
      size: number;
      type: string;
      utKey: string;
      url: string;
    },
    projectId?: string,
  ) {
    let bucket;
    if (projectId) {
      bucket = await this.getBucket(projectId, bucketId);
    } else {
      const [found] = await this.drizzle.db
        .select()
        .from(storageBuckets)
        .where(eq(storageBuckets.id, bucketId))
        .limit(1);

      if (!found) throw new NotFoundException('Bucket not found');
      bucket = found;
    }

    const url = bucket.access === 'public' ? file.url : '';

    const [object] = await this.drizzle.db
      .insert(storageObjects)
      .values({
        bucketId,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        utKey: file.utKey,
        url,
      })
      .returning();

    return object;
  }

  async deleteObject(objectId: string, projectId?: string) {
    let object;
    if (projectId) {
      object = await this.getObject(projectId, objectId);
    } else {
      const [found] = await this.drizzle.db
        .select()
        .from(storageObjects)
        .where(eq(storageObjects.id, objectId))
        .limit(1);

      if (!found) throw new NotFoundException('File not found');
      object = found;
    }

    await this.utapi.deleteFiles(object.utKey);

    await this.drizzle.db
      .delete(storageObjects)
      .where(eq(storageObjects.id, objectId));

    return { message: 'File deleted' };
  }

  async getSignedUrl(objectId: string, projectId?: string) {
    let object;
    if (projectId) {
      object = await this.getObject(projectId, objectId);
    } else {
      const [found] = await this.drizzle.db
        .select()
        .from(storageObjects)
        .where(eq(storageObjects.id, objectId))
        .limit(1);

      if (!found) throw new NotFoundException('File not found');
      object = found;
    }

    const { ufsUrl } = await this.utapi.generateSignedURL(object.utKey, {
      expiresIn: 3600,
    });

    return { url: ufsUrl };
  }

  async assertProjectSlug(
    projectId: string,
    projectSlug: string,
  ): Promise<void> {
    const [project] = await this.drizzle.db
      .select({ slug: projects.slug })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) throw new NotFoundException('Project not found');

    if (project.slug !== projectSlug) {
      throw new ForbiddenException('API key does not match this project URL');
    }
  }

  async getBucketByName(projectId: string, bucketName: string) {
    const [bucket] = await this.drizzle.db
      .select()
      .from(storageBuckets)
      .where(
        and(
          eq(storageBuckets.projectId, projectId),
          eq(storageBuckets.name, bucketName),
        ),
      )
      .limit(1);

    if (!bucket) throw new NotFoundException('Bucket not found');
    return bucket;
  }
}
