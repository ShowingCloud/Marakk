import { z } from 'zod';

/**
 * Prompt Augmentation Types
 * Defines structured inputs for prompt engineering
 */

export const PromptToneSchema = z.enum([
  'professional',
  'casual',
  'witty',
  'academic',
  'friendly',
  'formal',
  'creative',
  'technical',
]);

export type PromptTone = z.infer<typeof PromptToneSchema>;

export const PromptFormatSchema = z.enum([
  'paragraph',
  'bullet-points',
  'table',
  'list',
  'code',
  'json',
  'markdown',
]);

export type PromptFormat = z.infer<typeof PromptFormatSchema>;

export const PromptContextSchema = z.object({
  previousDocuments: z.array(z.string()).optional(), // Document IDs or content
  assets: z.array(z.string()).optional(), // Asset IDs
  relatedPrompts: z.array(z.string()).optional(), // Related prompt IDs
  metadata: z.record(z.unknown()).optional(),
});

export type PromptContext = z.infer<typeof PromptContextSchema>;

export const PromptAugmentationSchema = z.object({
  basePrompt: z.string().min(1, 'Prompt cannot be empty'),
  tone: PromptToneSchema.optional(),
  format: PromptFormatSchema.optional(),
  context: PromptContextSchema.optional(),
  maxLength: z.number().positive().optional(),
  includeExamples: z.boolean().optional().default(false),
  language: z.string().optional().default('en'),
});

export type PromptAugmentation = z.infer<typeof PromptAugmentationSchema>;

/**
 * Prompt Templates
 * Pre-defined prompt structures for common use cases
 */
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  tone?: PromptTone;
  format?: PromptFormat;
  systemPrompt?: string;
  example?: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'product-description',
    name: 'Product Description',
    description: 'Generate a compelling product description',
    tone: 'professional',
    format: 'paragraph',
    systemPrompt: 'You are a professional copywriter specializing in e-commerce product descriptions.',
    example: 'Write a product description for a wireless headphone',
  },
  {
    id: 'component-spec',
    name: 'Component Specification',
    description: 'Generate React component code with props and structure',
    tone: 'technical',
    format: 'code',
    systemPrompt: 'You are an expert React developer. Generate clean, production-ready component code.',
    example: 'Create a ProductCard component with image, title, price, and add to cart button',
  },
  {
    id: 'seo-content',
    name: 'SEO Content',
    description: 'Generate SEO-optimized content',
    tone: 'professional',
    format: 'paragraph',
    systemPrompt: 'You are an SEO content writer. Create content optimized for search engines while maintaining readability.',
    example: 'Write SEO content about sustainable fashion',
  },
  {
    id: 'ui-component',
    name: 'UI Component',
    description: 'Generate a complete UI component with styling',
    tone: 'creative',
    format: 'code',
    systemPrompt: 'You are a UI/UX designer and React developer. Create beautiful, accessible UI components.',
    example: 'Create a modern login form with email and password fields',
  },
];

