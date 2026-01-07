/**
 * Job type definitions for BullMQ
 * These define the structure of job data for different job types
 */

export interface ImageDescriptionJobData {
  assetId: string;
  organizationId: string;
  imageUrl: string;
  jobId?: string; // Optional: for tracking
}

export interface TextGenerationJobData {
  prompt: string;
  organizationId: string;
  context?: Record<string, unknown>;
  model?: string;
}

export interface ComponentGenerationJobData {
  prompt: string;
  organizationId: string;
  componentId?: string;
  context?: Record<string, unknown>;
  currentComponent?: {
    id: string;
    code?: string;
    props?: Record<string, unknown>;
  };
}

export type JobData = ImageDescriptionJobData | TextGenerationJobData | ComponentGenerationJobData;

export enum JobStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

export interface JobStatusResponse {
  id: string;
  name: string;
  status: JobStatus;
  progress?: number;
  result?: unknown;
  error?: string;
  createdAt: number;
  processedAt?: number;
  finishedAt?: number;
}

