'use server';

import { streamText } from 'ai';
import { createOpenAI } from 'ai/openai';
import { ThemeConfigSchema, type ThemeConfig } from '@repo/cms/lib/theme-schema';
import { z } from 'zod';

interface GenerateThemeOptions {
  description: string;
  style?: 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant';
  colorScheme?: 'light' | 'dark' | 'auto';
  organizationId: string;
}

/**
 * Generate a theme configuration using AI
 * Returns a structured ThemeConfig that can be stored in SiteConfig
 */
export async function generateTheme(options: GenerateThemeOptions): Promise<ThemeConfig> {
  const { description, style = 'modern', colorScheme = 'light', organizationId } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const systemPrompt = `You are an expert UI/UX designer specializing in design systems and theme generation.

Generate a complete theme configuration in JSON format based on the user's description.

Rules:
1. Return ONLY valid JSON matching the ThemeConfig schema
2. Use RGB color values (0-255 for r, g, b)
3. Use CSS-compatible values for spacing, typography, etc.
4. Ensure colors have good contrast ratios
5. Match the requested style (${style})
6. Use ${colorScheme} color scheme

ThemeConfig Schema:
{
  colors: {
    primary: { r: number, g: number, b: number, alpha?: number },
    secondary?: { r: number, g: number, b: number },
    accent?: { r: number, g: number, b: number },
    success?: { r: number, g: number, b: number },
    warning?: { r: number, g: number, b: number },
    error?: { r: number, g: number, b: number },
    background: {
      primary: { r: number, g: number, b: number },
      secondary?: { r: number, g: number, b: number },
      tertiary?: { r: number, g: number, b: number }
    },
    text: {
      primary: { r: number, g: number, b: number },
      secondary?: { r: number, g: number, b: number },
      tertiary?: { r: number, g: number, b: number }
    },
    border?: { r: number, g: number, b: number }
  },
  typography: {
    fontFamily: {
      sans: string,
      mono?: string,
      serif?: string
    },
    heading?: {
      fontFamily: string,
      fontSize: string,
      fontWeight?: "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900",
      lineHeight?: string
    },
    body?: {
      fontFamily: string,
      fontSize: string,
      fontWeight?: "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
    }
  },
  spacing: {
    xs: string,
    sm: string,
    md: string,
    lg: string,
    xl: string,
    "2xl"?: string,
    "3xl"?: string
  },
  borderRadius: {
    sm: string,
    md: string,
    lg: string,
    full?: string
  },
  shadows?: {
    sm: string,
    md: string,
    lg: string,
    xl?: string
  },
  transitions?: {
    fast?: string,
    base?: string,
    slow?: string
  }
}

Return ONLY the JSON object, no markdown, no explanations.`;

  const userPrompt = `Generate a theme configuration for: ${description}

Style: ${style}
Color Scheme: ${colorScheme}

Make it visually appealing and professional.`;

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

    // Collect the full response
    let fullResponse = '';
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }

    // Clean the response (remove markdown code blocks if present)
    let cleanResponse = fullResponse.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parse and validate
    const parsed = JSON.parse(cleanResponse);
    const validated = ThemeConfigSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Error generating theme:', error);
    throw new Error(`Failed to generate theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

