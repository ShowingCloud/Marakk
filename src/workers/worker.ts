import { Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { aiProcessor } from './processors/text-generation';

// Worker Factory
// Host creates and runs the worker with its own Redis connection
export function createAIWorker(connection: ConnectionOptions) {
  const worker = new Worker('ai-processing-queue', aiProcessor, {
    connection,
    concurrency: 5,
    lockDuration: 30000,
  });

  worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed`, err));

  return worker;
}

