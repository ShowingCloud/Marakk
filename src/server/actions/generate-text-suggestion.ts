'use server';

import { streamText } from 'ai';
import { createOpenAI } from 'ai/openai';

interface GenerateTextSuggestionOptions {
  textBeforeCursor: string;
  cursorPosition: number;
  organizationId: string;
}

/**
 * Generate a text suggestion using AI
 * Returns a continuation of the text before the cursor
 */
export async function generateTextSuggestion(
  options: GenerateTextSuggestionOptions
): Promise<string | null> {
  const { textBeforeCursor, organizationId } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    return null;
  }

  // Check credits (optional - can be added if needed)
  // For now, we'll skip credit checking for text suggestions to keep it lightweight

  try {
    const openai = createOpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    const result = await streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
      system: `You are a helpful writing assistant. Generate a natural continuation of the text provided by the user.
      
Rules:
1. Return ONLY the continuation text, no explanations
2. Keep it concise (1-3 sentences typically)
3. Match the writing style and tone of the input
4. Do not repeat what was already written
5. Make it feel natural and helpful`,
      prompt: `Continue this text naturally:\n\n${textBeforeCursor}`,
      temperature: 0.7,
      maxTokens: 100, // Keep suggestions short
    });

    // Collect the full response
    let fullResponse = '';
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }

    return fullResponse.trim() || null;
  } catch (error) {
    console.error('Error generating text suggestion:', error);
    return null;
  }
}
