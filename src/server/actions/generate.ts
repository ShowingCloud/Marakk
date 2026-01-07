'use server';

import OpenAI from 'openai';
import { z } from 'zod';
import { ComponentSchema } from '../../lib/types';

// Component generation response schema
const ComponentGenerationSchema = z.object({
  type: z.string(),
  props: z.record(z.unknown()),
  children: z.array(z.unknown()).optional(),
  styles: z.record(z.string()).optional(),
});

export type ComponentGeneration = z.infer<typeof ComponentGenerationSchema>;

interface GenerateComponentOptions {
  prompt: string;
  currentComponent?: {
    id: string;
    code?: string;
    props?: Record<string, unknown>;
  };
  context?: Record<string, unknown>;
}

/**
 * Generate a UI component using OpenAI
 * Returns structured JSON for a React component
 * 
 * @param prompt - The user's prompt describing what component to generate
 * @param options - Optional: currentComponent and context for better generation
 */
export async function generateComponent(
  prompt: string,
  options?: Omit<GenerateComponentOptions, 'prompt'>
): Promise<ComponentGeneration> {
  const { currentComponent, context } = options || {};

  // Initialize OpenAI client
  // Note: API key should be passed from host app via environment variable
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const openai = new OpenAI({
    apiKey,
  });

  // Build the system prompt
  const systemPrompt = `You are a React component generator. Generate valid React component JSON structures.
Return ONLY valid JSON that matches this schema:
{
  "type": "string (component name)",
  "props": { "key": "value" },
  "children": [ "optional array of child components" ],
  "styles": { "optional CSS styles" }
}

Do not include markdown code blocks or explanations. Return pure JSON only.`;

  // Build the user prompt with context
  let userPrompt = prompt;
  if (currentComponent) {
    userPrompt = `Current component: ${currentComponent.id}\n${
      currentComponent.code ? `Code: ${currentComponent.code}\n` : ''
    }${currentComponent.props ? `Props: ${JSON.stringify(currentComponent.props)}\n` : ''}\nUser request: ${prompt}`;
  }

  if (context) {
    userPrompt += `\n\nContext: ${JSON.stringify(context)}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the JSON response
    const parsed = JSON.parse(content);
    const validated = ComponentGenerationSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Error generating component:', error);
    throw new Error(`Failed to generate component: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

