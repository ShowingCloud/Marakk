import { generateComponentStream } from '../actions/generate-stream';
import { NextRequest } from 'next/server';

/**
 * API Route Handler for streaming component generation
 * This is mounted by the host app at /api/ai-editor/generate
 * 
 * Usage tracking: This endpoint counts as 1 credit per request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, componentId, context } = body;

    if (!prompt || !componentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, componentId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract tenantId from context or headers
    const tenantId = context?.tenantId || 
                     request.headers.get('x-tenant-id') ||
                     null;

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Missing tenantId in context or headers' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the current component info if available
    const currentComponent = {
      id: componentId,
    };

    // Call the streaming generation function (which will check credits)
    const stream = await generateComponentStream({
      prompt,
      currentComponent,
      context: {
        ...context,
        tenantId, // Ensure tenantId is in context
      },
    });

    return stream;
  } catch (error) {
    console.error('Error in generate route:', error);
    const statusCode = error instanceof Error && error.message.includes('credits') ? 402 : 500;
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

