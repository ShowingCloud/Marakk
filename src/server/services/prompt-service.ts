import 'server-only';
import { prisma } from '../db';
import { generateEmbedding } from '../../lib/embeddings';

export interface RelatedPrompt {
  id: string;
  prompt: string;
  response: string | null;
  similarity: number;
  createdAt: Date;
}

/**
 * Semantic search for related prompts using pgvector
 * @param queryPrompt - The prompt to search for
 * @param organizationId - Organization/tenant ID
 * @param limit - Maximum number of results (default: 5)
 * @param similarityThreshold - Minimum similarity score (0-1, default: 0.7)
 * @returns Array of related prompts with similarity scores
 */
export async function searchRelatedPrompts(
  queryPrompt: string,
  organizationId: string,
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<RelatedPrompt[]> {
  // Generate embedding for the query prompt
  const queryEmbedding = await generateEmbedding(queryPrompt);
  const embeddingString = `[${queryEmbedding.join(',')}]`;

  // Use raw SQL to perform cosine similarity search with pgvector
  // Note: This requires the pgvector extension to be installed in PostgreSQL
  const results = await prisma.$queryRaw<Array<{
    id: string;
    prompt: string;
    response: string | null;
    similarity: number;
    created_at: Date;
  }>>`
    SELECT 
      id,
      prompt,
      response,
      1 - (embedding <=> ${embeddingString}::vector) as similarity,
      created_at
    FROM editor_prompt_history
    WHERE 
      organization_id = ${organizationId}
      AND embedding IS NOT NULL
      AND embedding_generated = true
      AND 1 - (embedding <=> ${embeddingString}::vector) >= ${similarityThreshold}
    ORDER BY embedding <=> ${embeddingString}::vector
    LIMIT ${limit}
  `;

  return results.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    response: row.response,
    similarity: Number(row.similarity),
    createdAt: row.created_at,
  }));
}

/**
 * Store a prompt in history and optionally generate embedding
 * @param data - Prompt data
 * @param generateEmbeddingAsync - Whether to enqueue async embedding generation (default: true)
 * @returns Created prompt history record
 */
export async function storePrompt(
  data: {
    organizationId: string;
    prompt: string;
    response?: string;
    model?: string;
    tokensUsed?: number;
    metadata?: Record<string, unknown>;
  },
  generateEmbeddingAsync: boolean = true
): Promise<{ id: string; jobId?: string }> {
  const promptHistory = await prisma.promptHistory.create({
    data: {
      organizationId: data.organizationId,
      prompt: data.prompt,
      response: data.response || null,
      model: data.model || null,
      tokensUsed: data.tokensUsed || null,
      metadata: data.metadata || {},
      embeddingGenerated: false,
    },
  });

  // Return job ID if embedding will be generated async
  // The caller should enqueue the embedding job
  return {
    id: promptHistory.id,
    ...(generateEmbeddingAsync ? { jobId: 'pending' } : {}),
  };
}

/**
 * Get prompt history for an organization
 * @param organizationId - Organization/tenant ID
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of prompt history records
 */
export async function getPromptHistory(
  organizationId: string,
  limit: number = 20
): Promise<Array<{
  id: string;
  prompt: string;
  response: string | null;
  model: string | null;
  createdAt: Date;
}>> {
  return prisma.promptHistory.findMany({
    where: { organizationId },
    select: {
      id: true,
      prompt: true,
      response: true,
      model: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

