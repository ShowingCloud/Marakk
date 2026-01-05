import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

// Queue Factory
// Avoids global side effects - Host provides connection
export const getQueue = (connection: ConnectionOptions) =>
  new Queue('ai-processing-queue', { connection });

