'use server';

import { streamText } from 'ai';
import { createOpenAI } from 'ai/openai';

interface GenerateComponentStreamOptions {
  prompt: string;
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
 */
export async function generateComponentStream(options: GenerateComponentStreamOptions) {
  const { prompt, currentComponent, context } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Build the system prompt for React component generation
  const systemPrompt = `You are an expert React component generator. Generate valid React component code.

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
  let userPrompt = prompt;
  if (currentComponent) {
    userPrompt = `Current component: ${currentComponent.id}\n${
      currentComponent.code ? `Current code:\n\`\`\`jsx\n${currentComponent.code}\n\`\`\`\n` : ''
    }${currentComponent.props ? `Current props: ${JSON.stringify(currentComponent.props)}\n` : ''}\n\nUser request: ${prompt}`;
  }

  if (context) {
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

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error generating component stream:', error);
    throw new Error(`Failed to generate component: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

