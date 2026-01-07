'use server';

import { getQueue } from '../../workers/queue';
import type { ImageDescriptionJobData, TextGenerationJobData, ComponentGenerationJobData } from '../../lib/job-types';
import type { ConnectionOptions } from 'bullmq';

export interface PromptEmbeddingJobData {
  promptHistoryId: string;
  organizationId: string;
  prompt: string;
}

/**
 * Enqueue an image description job
 * Returns job ID for status tracking
 */
export async function enqueueImageDescription(
  data: ImageDescriptionJobData,
  queueConnection: ConnectionOptions
): Promise<{ jobId: string }> {
  const queue = getQueue(queueConnection);
  
  const job = await queue.add('image-description', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });

  return { jobId: job.id! };
}

/**
 * Enqueue a text generation job
 */
export async function enqueueTextGeneration(
  data: TextGenerationJobData,
  queueConnection: ConnectionOptions
): Promise<{ jobId: string }> {
  const queue = getQueue(queueConnection);
  
  const job = await queue.add('text-generation', data, {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 1000,
    },
  });

  return { jobId: job.id! };
}

/**
 * Enqueue a component generation job
 */
export async function enqueueComponentGeneration(
  data: ComponentGenerationJobData,
  queueConnection: ConnectionOptions
): Promise<{ jobId: string }> {
  const queue = getQueue(queueConnection);
  
  const job = await queue.add('component-generation', data, {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 1000,
    },
  });

  return { jobId: job.id! };
}

/**
 * Enqueue a prompt embedding generation job
 */
export async function enqueuePromptEmbedding(
  data: PromptEmbeddingJobData,
  queueConnection: ConnectionOptions
): Promise<{ jobId: string }> {
  const queue = getQueue(queueConnection);
  
  const job = await queue.add('prompt-embedding', data, {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 1000,
    },
  });

  return { jobId: job.id! };
}

/**
 * Get job status
 */
export async function getJobStatus(
  jobId: string,
  queueConnection: ConnectionOptions
): Promise<{
  id: string;
  name: string;
  status: string;
  progress?: number;
  result?: unknown;
  error?: string;
  createdAt: number;
  processedAt?: number;
  finishedAt?: number;
} | null> {
  const queue = getQueue(queueConnection);
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id!,
    name: job.name,
    status: state,
    progress: typeof progress === 'number' ? progress : undefined,
    result: await job.returnvalue,
    error: job.failedReason,
    createdAt: job.timestamp,
    processedAt: job.processedOn,
    finishedAt: job.finishedOn,
  };
}

