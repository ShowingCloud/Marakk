import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';

// Get Redis connection
function getRedisConnection(redisUrl?: string): ConnectionOptions {
  const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  const connection = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  return { connection } as ConnectionOptions;
}

// Queue Factory
// Avoids global side effects - Host provides connection
export const getQueue = (connection: ConnectionOptions) =>
  new Queue('ai-processing-queue', { connection });

// Inpainting queue (separate queue for image inpainting jobs)
export const getInpaintingQueue = (connection: ConnectionOptions) =>
  new Queue('image-inpainting', { connection });
