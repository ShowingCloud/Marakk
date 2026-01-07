import { z } from 'zod';

// Zod schemas for LLM structured outputs
// These ensure type-safe AI responses

// Component generation schema
export const ComponentSchema = z.object({
  type: z.string(),
  props: z.record(z.unknown()),
  children: z.array(z.unknown()).optional(),
  styles: z.record(z.string()).optional(),
});

export type Component = z.infer<typeof ComponentSchema>;

// Prompt response schema
export const PromptResponseSchema = z.object({
  text: z.string(),
  tokensUsed: z.number().optional(),
  model: z.string().optional(),
});

export type PromptResponse = z.infer<typeof PromptResponseSchema>;

// Editor Project schema
export const EditorProjectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  schema: z.record(z.unknown()),
  isPublished: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EditorProject = z.infer<typeof EditorProjectSchema>;

// Generation History schema
export const GenerationHistorySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string().optional(),
  prompt: z.string(),
  response: z.record(z.unknown()).optional(),
  model: z.string().optional(),
  tokensUsed: z.number().optional(),
  componentId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type GenerationHistory = z.infer<typeof GenerationHistorySchema>;

