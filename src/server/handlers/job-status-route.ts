import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus } from '../actions/jobs';
import Redis from 'ioredis';

/**
 * API Route Handler for job status
 * This is mounted by the host app at /api/ai-editor/jobs/[jobId]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    // Get Redis connection from environment
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const connection = new Redis(redisUrl);

    const status = await getJobStatus(jobId, { connection } as any);

    await connection.quit();

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
}

