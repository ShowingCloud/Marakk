'use server';

import { prisma } from '../db';
import { enqueueImageDescription } from './jobs';
import Redis from 'ioredis';
import type { ConnectionOptions } from 'bullmq';

interface UploadAssetOptions {
  organizationId: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  autoDescribe?: boolean; // Whether to automatically generate AI description
}

/**
 * Upload and register an asset
 * Optionally enqueues async image description job
 * Note: This is a server action, so it creates its own Redis connection
 */
export async function uploadAsset(options: UploadAssetOptions) {
  const {
    organizationId,
    url,
    fileName,
    mimeType,
    fileSize,
    autoDescribe = true,
  } = options;

  // Create asset record
  const asset = await prisma.asset.create({
    data: {
      organizationId,
      url,
      fileName: fileName || null,
      mimeType: mimeType || null,
      fileSize: fileSize || null,
      metadata: {
        uploadedAt: new Date().toISOString(),
        status: autoDescribe ? 'pending_description' : 'ready',
      },
    },
  });

  // If it's an image and auto-describe is enabled, enqueue description job
  if (autoDescribe && mimeType?.startsWith('image/')) {
    try {
      // Create Redis connection for queue
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const connection = new Redis(redisUrl);

      const { jobId } = await enqueueImageDescription(
        {
          assetId: asset.id,
          organizationId,
          imageUrl: url,
        },
        { connection } as ConnectionOptions
      );

      await connection.quit();

      // Update asset with job ID
      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          metadata: {
            ...(asset.metadata as Record<string, unknown> || {}),
            descriptionJobId: jobId,
          },
        },
      });

      return {
        asset,
        jobId,
        status: 'pending_description' as const,
      };
    } catch (error) {
      console.error('Error enqueueing image description:', error);
      // Continue even if job enqueue fails
    }
  }

  return {
    asset,
    status: 'ready' as const,
  };
}

