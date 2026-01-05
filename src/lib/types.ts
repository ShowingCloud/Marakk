import { z } from 'zod';

// Zod schemas for LLM structured outputs
// These ensure type-safe AI responses

// Example: Component generation schema
export const ComponentSchema = z.object({
  type: z.string(),
  props: z.record(z.unknown()),
  children: z.array(z.unknown()).optional(),
});

export type Component = z.infer<typeof ComponentSchema>;

// Example: Prompt response schema
export const PromptResponseSchema = z.object({
  text: z.string(),
  tokensUsed: z.number().optional(),
  model: z.string().optional(),
});

export type PromptResponse = z.infer<typeof PromptResponseSchema>;

// Add more schemas as needed for different AI operations

