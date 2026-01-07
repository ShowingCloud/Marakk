import { Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { routeJobProcessor } from './processors';

// Worker Factory
// Host creates and runs the worker with its own Redis connection
export function createAIWorker(connection: ConnectionOptions) {
  const worker = new Worker('ai-processing-queue', routeJobProcessor, {
    connection,
    concurrency: 5,
    lockDuration: 30000,
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  });

  // Event handlers for monitoring
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} (${job?.name}) failed:`, err);
  });

  worker.on('active', (job) => {
    console.log(`🔄 Job ${job.id} (${job.name}) started processing`);
  });

  worker.on('progress', (job, progress) => {
    if (progress && typeof progress === 'number') {
      console.log(`📊 Job ${job.id} progress: ${progress}%`);
    }
  });

  return worker;
}

