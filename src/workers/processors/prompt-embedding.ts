import type { Job } from 'bullmq';
import { generateEmbedding } from '../../lib/embeddings';
import { prisma } from '../../server/db';

interface PromptEmbeddingJobData {
  promptHistoryId: string;
  organizationId: string;
  prompt: string;
}

/**
 * Processor for async prompt embedding generation
 * Generates vector embeddings for semantic search
 */
export async function promptEmbeddingProcessor(job: Job<PromptEmbeddingJobData>) {
  const { promptHistoryId, organizationId, prompt } = job.data;

  try {
    await job.updateProgress(10);

    // Generate embedding
    const embedding = await generateEmbedding(prompt);
    await job.updateProgress(80);

    // Store embedding in database using raw SQL (pgvector)
    // Note: Prisma doesn't support pgvector types directly, so we use raw SQL
    const embeddingString = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      UPDATE editor_prompt_history
      SET 
        embedding = ${embeddingString}::vector,
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{embeddingGenerated}',
          'true'::jsonb
        )
      WHERE id = ${promptHistoryId}::uuid
    `;

    // Also update the Prisma model flag
    await prisma.promptHistory.update({
      where: { id: promptHistoryId },
      data: {
        embeddingGenerated: true,
        metadata: {
          embeddingModel: 'text-embedding-3-small',
          embeddingDimensions: 1536,
          embeddingGeneratedAt: new Date().toISOString(),
        },
      },
    });

    await job.updateProgress(100);

    return {
      success: true,
      promptHistoryId,
      embeddingDimensions: embedding.length,
    };
  } catch (error) {
    console.error(`Error processing prompt embedding for ${promptHistoryId}:`, error);

    // Mark as failed in database
    await prisma.promptHistory.update({
      where: { id: promptHistoryId },
      data: {
        metadata: {
          embeddingError: error instanceof Error ? error.message : 'Unknown error',
          embeddingFailedAt: new Date().toISOString(),
        },
      },
    });

    throw error;
  }
}

