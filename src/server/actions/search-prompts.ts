'use server';

import { searchRelatedPrompts, storePrompt } from '../services/prompt-service';
import { enqueuePromptEmbedding } from './jobs';
import Redis from 'ioredis';
import type { ConnectionOptions } from 'bullmq';

/**
 * Search for related prompts using semantic search
 * @param queryPrompt - The prompt to search for
 * @param organizationId - Organization/tenant ID
 * @param limit - Maximum number of results (default: 5)
 * @returns Array of related prompts with similarity scores
 */
export async function searchPrompts(
  queryPrompt: string,
  organizationId: string,
  limit: number = 5
) {
  return searchRelatedPrompts(queryPrompt, organizationId, limit);
}

/**
 * Store a prompt and optionally generate embedding
 * @param data - Prompt data
 * @param generateEmbedding - Whether to generate embedding (default: true)
 * @returns Created prompt with optional job ID for embedding
 */
export async function storePromptWithEmbedding(
  data: {
    organizationId: string;
    prompt: string;
    response?: string;
    model?: string;
    tokensUsed?: number;
    metadata?: Record<string, unknown>;
  },
  generateEmbedding: boolean = true
): Promise<{ id: string; jobId?: string }> {
  const result = await storePrompt(data, generateEmbedding);

  // Enqueue embedding generation if requested
  if (generateEmbedding) {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const connection = new Redis(redisUrl);

      const { jobId } = await enqueuePromptEmbedding(
        {
          promptHistoryId: result.id,
          organizationId: data.organizationId,
          prompt: data.prompt,
        },
        { connection } as ConnectionOptions
      );

      await connection.quit();

      return {
        id: result.id,
        jobId,
      };
    } catch (error) {
      console.error('Error enqueueing prompt embedding:', error);
      // Continue even if embedding job fails
    }
  }

  return result;
}

