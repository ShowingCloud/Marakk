import { generateComponentStream } from '../actions/generate-stream';
import { NextRequest } from 'next/server';

/**
 * API Route Handler for streaming component generation
 * This is mounted by the host app at /api/ai-editor/generate
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

    // Get the current component info if available
    const currentComponent = {
      id: componentId,
    };

    // Call the streaming generation function
    const stream = await generateComponentStream({
      prompt,
      currentComponent,
      context,
    });

    return stream;
  } catch (error) {
    console.error('Error in generate route:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

