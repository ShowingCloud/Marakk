import type { Job } from 'bullmq';
import { imageDescriptionProcessor } from './image-description';
import { aiProcessor } from './text-generation';
import { promptEmbeddingProcessor } from './prompt-embedding';

/**
 * Main job router - routes jobs to appropriate processors based on job name
 */
export async function routeJobProcessor(job: Job) {
  const jobName = job.name;

  switch (jobName) {
    case 'image-description':
      return imageDescriptionProcessor(job);
    case 'text-generation':
    case 'component-generation':
      return aiProcessor(job);
    case 'prompt-embedding':
      return promptEmbeddingProcessor(job);
    case 'image-inpainting':
      const { processImageInpainting } = await import('./image-inpainting');
      return processImageInpainting(job);
    default:
      throw new Error(`Unknown job type: ${jobName}`);
  }
}

// Export individual processors for direct use
export { imageDescriptionProcessor } from './image-description';
export { aiProcessor } from './text-generation';
export { promptEmbeddingProcessor } from './prompt-embedding';

