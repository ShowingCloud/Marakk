import type { Job } from 'bullmq';
import OpenAI from 'openai';
import { prisma } from '../../server/db';

interface ImageDescriptionJobData {
  assetId: string;
  organizationId: string;
  imageUrl: string;
}

/**
 * Processor for async image description using Vision models
 * This handles long-running image analysis tasks
 */
export async function imageDescriptionProcessor(job: Job<ImageDescriptionJobData>) {
  const { assetId, organizationId, imageUrl } = job.data;

  try {
    // Update job progress
    await job.updateProgress(10);

    // Initialize OpenAI client
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const openai = new OpenAI({ apiKey });

    // Download image (or use URL directly if accessible)
    await job.updateProgress(30);

    // Call Vision API
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate a detailed, accessibility-focused description of this image. Include: 1) A clear description of what is shown, 2) Semantic tags for searchability, 3) Color palette if relevant, 4) Any text visible in the image. Return as JSON with keys: description, tags (array), colors (array), text (string or null).',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    await job.updateProgress(80);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI Vision API');
    }

    // Parse the response (should be JSON)
    let descriptionData: {
      description: string;
      tags: string[];
      colors?: string[];
      text?: string | null;
    };

    try {
      descriptionData = JSON.parse(content);
    } catch {
      // If not JSON, use the raw text as description
      descriptionData = {
        description: content,
        tags: [],
      };
    }

    // Update asset in database
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        aiDescription: descriptionData.description,
        metadata: {
          tags: descriptionData.tags,
          colors: descriptionData.colors || [],
          extractedText: descriptionData.text || null,
          processedAt: new Date().toISOString(),
        },
      },
    });

    await job.updateProgress(100);

    return {
      success: true,
      assetId,
      description: descriptionData.description,
      tags: descriptionData.tags,
    };
  } catch (error) {
    console.error(`Error processing image description for asset ${assetId}:`, error);
    
    // Update asset with error status
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date().toISOString(),
        },
      },
    });

    throw error;
  }
}

