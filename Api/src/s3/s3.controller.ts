import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CreateS3BucketDto } from './dto/create-s3-bucket.dto';
import { DeleteS3ObjectsDto } from './dto/delete-s3-objects.dto';
import { DownloadS3ObjectsDto } from './dto/download-s3-objects.dto';
import { ListS3ObjectsQueryDto } from './dto/list-s3-objects-query.dto';
import { ListS3QueryDto } from './dto/list-s3-query.dto';
import { RenameS3ObjectDto } from './dto/rename-s3-object.dto';
import { UploadS3ObjectDto } from './dto/upload-s3-object.dto';
import { S3Service } from './s3.service';
import { CookieAuthGuard } from '../shared/auth/cookie-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/cookie-auth.guard';

@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Get('buckets')
  @UseGuards(CookieAuthGuard)
  async listBuckets(
    @Query() query: ListS3QueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.s3Service.listBuckets(request.user!.id, query);
  }

  @Post('buckets')
  @UseGuards(CookieAuthGuard)
  async createBucket(
    @Body() createBucketDto: CreateS3BucketDto,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.s3Service.createBucket(request.user!.id, createBucketDto);

    return {
      success: true,
    };
  }

  @Post('buckets/:bucketName/empty')
  @UseGuards(CookieAuthGuard)
  async emptyBucket(
    @Param('bucketName') bucketName: string,
    @Query() query: ListS3QueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const deletedObjects = await this.s3Service.emptyBucket(
      request.user!.id,
      bucketName,
      query,
    );

    return {
      success: true,
      deletedObjects,
    };
  }

  @Get('buckets/:bucketName/objects')
  @UseGuards(CookieAuthGuard)
  async listObjects(
    @Param('bucketName') bucketName: string,
    @Query() query: ListS3ObjectsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.s3Service.listBucketObjects(request.user!.id, bucketName, query);
  }

  @Post('buckets/:bucketName/objects')
  @UseGuards(CookieAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadObject(
    @Param('bucketName') bucketName: string,
    @Body() uploadObjectDto: UploadS3ObjectDto,
    @UploadedFile() file: any,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.s3Service.uploadObject(
      request.user!.id,
      bucketName,
      uploadObjectDto,
      file,
    );

    return {
      success: true,
    };
  }

  @Post('buckets/:bucketName/objects/download')
  @UseGuards(CookieAuthGuard)
  async downloadObjects(
    @Param('bucketName') bucketName: string,
    @Body() downloadObjectsDto: DownloadS3ObjectsDto,
    @Req() request: AuthenticatedRequest,
    @Res() response: any,
  ) {
    const download = await this.s3Service.downloadSelectedObjects(
      request.user!.id,
      bucketName,
      downloadObjectsDto,
    );

    response.setHeader('Content-Type', download.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${download.filename}"`,
    );
    response.send(download.body);
  }

  @Patch('buckets/:bucketName/objects/rename')
  @UseGuards(CookieAuthGuard)
  async renameObject(
    @Param('bucketName') bucketName: string,
    @Body() renameObjectDto: RenameS3ObjectDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const renamedObjects = await this.s3Service.renameObject(
      request.user!.id,
      bucketName,
      renameObjectDto,
    );

    return {
      success: true,
      renamedObjects,
    };
  }

  @Delete('buckets/:bucketName/objects')
  @UseGuards(CookieAuthGuard)
  async deleteObjects(
    @Param('bucketName') bucketName: string,
    @Body() deleteObjectsDto: DeleteS3ObjectsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const deletedObjects = await this.s3Service.deleteSelectedObjects(
      request.user!.id,
      bucketName,
      deleteObjectsDto,
    );

    return {
      success: true,
      deletedObjects,
    };
  }

  @Delete('buckets/:bucketName')
  @UseGuards(CookieAuthGuard)
  async deleteBucket(
    @Param('bucketName') bucketName: string,
    @Query() query: ListS3QueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.s3Service.deleteBucket(request.user!.id, bucketName, query);

    return {
      success: true,
    };
  }
}
