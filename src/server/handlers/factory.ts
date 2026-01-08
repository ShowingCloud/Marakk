import { NextRequest, NextResponse } from 'next/server';
import type { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import { generateComponentStream } from '../actions/generate-stream';
import { getJobStatus } from '../actions/jobs';
import { searchPrompts } from '../actions/search-prompts';

/**
 * Route Factory Configuration
 * Allows the host application to inject configuration at runtime
 */
export interface RouteFactoryConfig {
  // OpenAI configuration
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;

  // Redis configuration for queues
  redisUrl?: string;
  redisConnection?: ConnectionOptions;

  // Other configuration
  enableBilling?: boolean;
  defaultTenantId?: string;
}

/**
 * Create a Redis connection from config
 */
function getRedisConnection(config: RouteFactoryConfig): ConnectionOptions {
  if (config.redisConnection) {
    return config.redisConnection;
  }

  const redisUrl = config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  return { connection } as ConnectionOptions;
}

/**
 * Route Factory for AI Editor API handlers
 * Creates route handlers with injected configuration
 */
export function createAIEditorRoutes(config: RouteFactoryConfig = {}) {
  // Set environment variables from config if provided
  if (config.openaiApiKey) {
    process.env.OPENAI_API_KEY = config.openaiApiKey;
  }
  if (config.openaiBaseUrl) {
    process.env.OPENAI_BASE_URL = config.openaiBaseUrl;
  }
  if (config.openaiModel) {
    process.env.OPENAI_MODEL = config.openaiModel;
  }

  const redisConnection = getRedisConnection(config);

  return {
    /**
     * POST /generate - Stream component generation
     */
    generate: async (request: NextRequest) => {
      try {
        const body = await request.json();
        const { prompt, componentId, context } = body;

        if (!prompt || !componentId) {
          return NextResponse.json(
            { error: 'Missing required fields: prompt, componentId' },
            { status: 400 }
          );
        }

        // Extract tenantId from context or use default
        const tenantId = context?.tenantId || 
                         request.headers.get('x-tenant-id') ||
                         config.defaultTenantId ||
                         null;

        if (!tenantId && config.enableBilling !== false) {
          return NextResponse.json(
            { error: 'Missing tenantId in context or headers' },
            { status: 400 }
          );
        }

        const currentComponent = {
          id: componentId,
        };

        const stream = await generateComponentStream({
          prompt,
          currentComponent,
          context: {
            ...context,
            tenantId: tenantId || undefined,
          },
        });

        return stream;
      } catch (error) {
        console.error('Error in generate route:', error);
        const statusCode = error instanceof Error && error.message.includes('credits') ? 402 : 500;
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Internal server error' },
          { status: statusCode }
        );
      }
    },

    /**
     * GET /jobs/[jobId] - Get job status
     */
    jobStatus: async (
      request: NextRequest,
      context: { params: Promise<{ jobId: string }> }
    ) => {
      try {
        const { jobId } = await context.params;

        if (!jobId) {
          return NextResponse.json(
            { error: 'Missing jobId parameter' },
            { status: 400 }
          );
        }

        const status = await getJobStatus(jobId, redisConnection);

        if (!status) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          );
        }

        return NextResponse.json(status);
      } catch (error) {
        console.error('Error getting job status:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Internal server error' },
          { status: 500 }
        );
      }
    },

    /**
     * POST /prompts/search - Semantic prompt search
     */
    searchPrompts: async (request: NextRequest) => {
      try {
        const body = await request.json();
        const { queryPrompt, organizationId, limit = 5 } = body;

        if (!queryPrompt || !organizationId) {
          return NextResponse.json(
            { error: 'Missing required fields: queryPrompt, organizationId' },
            { status: 400 }
          );
        }

        const results = await searchPrompts(queryPrompt, organizationId, limit);

        return NextResponse.json(results);
      } catch (error) {
        console.error('Error searching prompts:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Internal server error' },
          { status: 500 }
        );
      }
    },

    /**
     * POST /inpaint - Submit image inpainting job
     */
    inpaint: async (request: NextRequest) => {
      try {
        const body = await request.json();
        const { imageId, imageUrl, maskData, coordinates, organizationId, prompt } = body;

        if (!imageId || !imageUrl || !maskData || !organizationId) {
          return NextResponse.json(
            { error: 'Missing required fields: imageId, imageUrl, maskData, organizationId' },
            { status: 400 }
          );
        }

        // Import queue dynamically
        const { getInpaintingQueue } = await import('../../workers/queue');
        const inpaintingQueue = getInpaintingQueue(redisConnection);

        // Add job to queue
        const job = await inpaintingQueue.add(
          'image-inpainting',
          {
            imageId,
            imageUrl,
            maskData,
            coordinates: coordinates || [],
            organizationId,
            prompt: prompt || 'Fill the masked area naturally',
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          }
        );

        return NextResponse.json({ jobId: job.id }, { status: 202 });
      } catch (error) {
        console.error('Error submitting inpainting job:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Internal server error' },
          { status: 500 }
        );
      }
    },

    /**
     * GET /health - Health check endpoint
     */
    health: async () => {
      return NextResponse.json({
        status: 'ok',
        service: 'ai-editor',
        timestamp: new Date().toISOString(),
        config: {
          hasOpenAIKey: !!config.openaiApiKey || !!process.env.OPENAI_API_KEY,
          hasRedis: !!config.redisUrl || !!process.env.REDIS_URL,
        },
      });
    },
  };
}

/**
 * Default route handlers (using environment variables)
 * For backward compatibility
 */
export const defaultRoutes = createAIEditorRoutes();

