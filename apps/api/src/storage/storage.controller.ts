import {
  All,
  Body,
  Controller,
  Delete,
  Get,
  Next,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { createRouteHandler } from 'uploadthing/express';
import { IsNumber, IsEnum, IsString } from 'class-validator';
import { StorageService } from './storage.service';
import { storageRouter } from './uploadthing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgRoleGuard } from '../auth/guards/org-role.guard';
import type { BucketAccess } from '@orion/types';

class CreateBucketDto {
  @IsString()
  name!: string;

  @IsEnum(['public', 'private'])
  access!: BucketAccess;
}

class SaveObjectDto {
  @IsString()
  name!: string;

  @IsNumber()
  size!: number;

  @IsString()
  type!: string;

  @IsString()
  utKey!: string;

  @IsString()
  url!: string;
}

const utHandler = createRouteHandler({ router: storageRouter });

@Controller('orgs/:slug/projects/:projectSlug/storage')
@UseGuards(JwtAuthGuard, OrgRoleGuard)
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get('buckets')
  getBuckets(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
  ) {
    return this.storageService.getBuckets(slug, projectSlug);
  }

  @Post('buckets')
  createBucket(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Body() dto: CreateBucketDto,
  ) {
    return this.storageService.createBucket(
      slug,
      projectSlug,
      dto.name,
      dto.access,
    );
  }

  @Delete('buckets/:bucketId')
  async deleteBucket(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Param('bucketId') bucketId: string,
  ) {
    const project = await this.storageService.getProject(slug, projectSlug);
    return this.storageService.deleteBucket(bucketId, project.id);
  }

  @Get('buckets/:bucketId/objects')
  async getObjects(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Param('bucketId') bucketId: string,
  ) {
    const project = await this.storageService.getProject(slug, projectSlug);
    return this.storageService.getObjects(bucketId, project.id);
  }

  // UploadThing upload endpoint — proxies the UT protocol (GET + POST)
  @All('buckets/:bucketId/upload')
  async handleUpload(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Param('bucketId') bucketId: string,
  ): Promise<void> {
    const project = await this.storageService.getProject(slug, projectSlug);
    await this.storageService.getBucket(project.id, bucketId);

    const originalUrl = req.url;
    const queryIndex = originalUrl.indexOf('?');
    const query = queryIndex >= 0 ? originalUrl.slice(queryIndex) : '';
    req.url = `/${query}`;
    utHandler(req, res, (err?: unknown) => {
      req.url = originalUrl;
      if (err) next(err);
    });
  }

  @Post('buckets/:bucketId/objects')
  async saveObject(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Param('bucketId') bucketId: string,
    @Body() file: SaveObjectDto,
  ) {
    const project = await this.storageService.getProject(slug, projectSlug);
    return this.storageService.saveObject(bucketId, file, project.id);
  }

  @Delete('objects/:objectId')
  async deleteObject(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Param('objectId') objectId: string,
  ) {
    const project = await this.storageService.getProject(slug, projectSlug);
    return this.storageService.deleteObject(objectId, project.id);
  }

  @Get('objects/:objectId/signed-url')
  async getSignedUrl(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Param('objectId') objectId: string,
  ) {
    const project = await this.storageService.getProject(slug, projectSlug);
    return this.storageService.getSignedUrl(objectId, project.id);
  }
}
