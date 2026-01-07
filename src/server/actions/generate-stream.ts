'use server';

import { streamText } from 'ai';
import { createOpenAI } from 'ai/openai';
import { checkCredits, deductCredits } from '@repo/commerce';
import type { PromptAugmentation } from '../../lib/prompt-types';
import { buildPromptPair } from '../../lib/prompt-synthesis';

interface GenerateComponentStreamOptions {
  prompt: string | PromptAugmentation; // Support both simple string and structured prompt
  currentComponent?: {
    id: string;
    code?: string;
    props?: Record<string, unknown>;
  };
  context?: Record<string, unknown>;
}

/**
 * Generate a React component using OpenAI with streaming
 * Returns a stream of React component code
 * 
 * Enforces credits check before calling OpenAI
 * Deducts 1 credit per generation request
 */
export async function generateComponentStream(options: GenerateComponentStreamOptions) {
  const { prompt, currentComponent, context } = options;

  // Extract tenantId from context
  const tenantId = context?.tenantId as string | undefined;
  if (!tenantId) {
    throw new Error('tenantId is required in context for billing');
  }

  // Check credits before proceeding (1 credit per generation)
  const hasCredits = await checkCredits(tenantId, 1);
  if (!hasCredits) {
    throw new Error(`Insufficient credits. Please purchase credits to continue using AI generation.`);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Determine if prompt is structured or simple string
  const isStructuredPrompt = typeof prompt === 'object' && 'basePrompt' in prompt;
  
  let systemPrompt: string;
  let userPrompt: string;

  if (isStructuredPrompt) {
    // Use structured prompt synthesis
    const promptPair = buildPromptPair(prompt as PromptAugmentation, context);
    systemPrompt = promptPair.system;
    userPrompt = promptPair.user;
    
    // Add component-specific instructions for React generation
    systemPrompt += '\n\nYou are generating React component code. Return ONLY the React component code, no markdown, no explanations. Use functional components with React hooks. Export as default export. Include proper data-component-id attributes.';
  } else {
    // Use simple prompt with default system prompt
    systemPrompt = `You are an expert React component generator. Generate valid React component code.

Rules:
1. Return ONLY the React component code, no markdown, no explanations
2. Use functional components with React hooks
3. If the prompt mentions "products" or "ProductList", use the products from context.products array
4. Use the context data provided to populate the component
5. Export the component as default export
6. Use JSX syntax
7. Include proper data-component-id attributes for editor integration

Example:
\`\`\`jsx
export default function ProductList({ products }) {
  return (
    <div data-component-id="product-list">
      {products.map(product => (
        <div key={product.id} className="product-item">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <span>${product.price}</span>
        </div>
      ))}
    </div>
  );
}
\`\`\``;

    // Build the user prompt with context
    userPrompt = prompt as string;
  }

  // Add current component context if available
  if (currentComponent) {
    userPrompt = `Current component: ${currentComponent.id}\n${
      currentComponent.code ? `Current code:\n\`\`\`jsx\n${currentComponent.code}\n\`\`\`\n` : ''
    }${currentComponent.props ? `Current props: ${JSON.stringify(currentComponent.props)}\n` : ''}\n\nUser request: ${userPrompt}`;
  }

  // Add context data if not already included (for simple prompts)
  if (context && !isStructuredPrompt) {
    userPrompt += `\n\nAvailable context data:\n${JSON.stringify(context, null, 2)}\n\nUse this context data in your component. For example, if context.products exists, use it to render a product list.`;
  }

  try {
    const openai = createOpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    const result = await streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Deduct credits after successful generation
    // We do this after the stream is created but before returning
    // In case of errors, credits won't be deducted
    try {
      await deductCredits(tenantId, 1);
    } catch (creditError) {
      console.error('Error deducting credits:', creditError);
      // Log but don't fail the request - credits were already checked
    }

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error generating component stream:', error);
    throw new Error(`Failed to generate component: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

