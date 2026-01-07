import type { PromptAugmentation, PromptTone, PromptFormat } from './prompt-types';

/**
 * Prompt Synthesis
 * Combines structured prompt inputs into a comprehensive system and user prompt
 */

const TONE_INSTRUCTIONS: Record<PromptTone, string> = {
  professional: 'Use a professional, business-appropriate tone. Be clear, concise, and respectful.',
  casual: 'Use a casual, conversational tone. Be friendly and approachable.',
  witty: 'Use a witty, humorous tone. Be clever and engaging while staying on-topic.',
  academic: 'Use an academic, scholarly tone. Be precise, well-researched, and cite sources when appropriate.',
  friendly: 'Use a warm, friendly tone. Be approachable and helpful.',
  formal: 'Use a formal, official tone. Be precise and follow formal writing conventions.',
  creative: 'Use a creative, imaginative tone. Be expressive and original.',
  technical: 'Use a technical, precise tone. Be accurate and detailed with technical terminology.',
};

const FORMAT_INSTRUCTIONS: Record<PromptFormat, string> = {
  paragraph: 'Format the response as well-structured paragraphs with proper flow.',
  'bullet-points': 'Format the response as a bulleted list with clear, concise points.',
  table: 'Format the response as a table with appropriate headers and rows.',
  list: 'Format the response as a numbered or bulleted list.',
  code: 'Format the response as code with proper syntax highlighting and comments.',
  json: 'Format the response as valid JSON with proper structure.',
  markdown: 'Format the response as Markdown with appropriate headings, lists, and formatting.',
};

/**
 * Synthesize a system prompt from structured inputs
 */
export function synthesizeSystemPrompt(augmentation: PromptAugmentation): string {
  const parts: string[] = [];

  // Base system prompt
  parts.push('You are an expert AI assistant specialized in generating high-quality content and code.');

  // Add tone instruction
  if (augmentation.tone) {
    parts.push(TONE_INSTRUCTIONS[augmentation.tone]);
  }

  // Add format instruction
  if (augmentation.format) {
    parts.push(FORMAT_INSTRUCTIONS[augmentation.format]);
  }

  // Add length constraint
  if (augmentation.maxLength) {
    parts.push(`Keep the response under ${augmentation.maxLength} characters.`);
  }

  // Add language instruction
  if (augmentation.language && augmentation.language !== 'en') {
    parts.push(`Respond in ${augmentation.language}.`);
  }

  // Add context awareness
  if (augmentation.context) {
    if (augmentation.context.previousDocuments?.length) {
      parts.push('Consider the context from previous documents when generating the response.');
    }
    if (augmentation.context.assets?.length) {
      parts.push('Reference the provided assets when relevant to the prompt.');
    }
    if (augmentation.context.relatedPrompts?.length) {
      parts.push('Consider related prompts for consistency and context.');
    }
  }

  // Add example instruction
  if (augmentation.includeExamples) {
    parts.push('Include relevant examples to illustrate key points.');
  }

  return parts.join(' ');
}

/**
 * Synthesize a user prompt with context injection
 */
export function synthesizeUserPrompt(augmentation: PromptAugmentation, contextData?: Record<string, unknown>): string {
  const parts: string[] = [];

  // Base prompt
  parts.push(augmentation.basePrompt);

  // Inject context data if available
  if (contextData) {
    const contextStrings: string[] = [];

    if (contextData.products && Array.isArray(contextData.products)) {
      contextStrings.push(`Available products: ${JSON.stringify(contextData.products, null, 2)}`);
    }

    if (contextData.tenantId) {
      contextStrings.push(`Tenant context: ${contextData.tenantId}`);
    }

    if (Object.keys(contextData).length > 0) {
      parts.push('\n\nContext:');
      parts.push(contextStrings.join('\n'));
    }
  }

  // Add context from augmentation
  if (augmentation.context) {
    const contextParts: string[] = [];

    if (augmentation.context.previousDocuments?.length) {
      contextParts.push(`Previous documents: ${augmentation.context.previousDocuments.length} referenced`);
    }

    if (augmentation.context.assets?.length) {
      contextParts.push(`Assets: ${augmentation.context.assets.length} referenced`);
    }

    if (augmentation.context.relatedPrompts?.length) {
      contextParts.push(`Related prompts: ${augmentation.context.relatedPrompts.length} referenced`);
    }

    if (contextParts.length > 0) {
      parts.push('\n\nAdditional context:');
      parts.push(contextParts.join('\n'));
    }
  }

  return parts.join('\n');
}

/**
 * Build complete prompt pair (system + user) from augmentation
 */
export function buildPromptPair(
  augmentation: PromptAugmentation,
  contextData?: Record<string, unknown>
): { system: string; user: string } {
  return {
    system: synthesizeSystemPrompt(augmentation),
    user: synthesizeUserPrompt(augmentation, contextData),
  };
}

