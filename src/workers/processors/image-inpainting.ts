import { Job } from 'bullmq';
import OpenAI from 'openai';
import { prisma } from '../../db';

interface ImageInpaintingJobData {
  imageId: string;
  imageUrl: string;
  maskData: string; // Base64 encoded mask image
  coordinates: Array<{ x: number; y: number }>;
  organizationId: string;
  prompt: string;
}

/**
 * Image Inpainting Processor
 * Processes async inpainting jobs using OpenAI's DALL-E or similar diffusion models
 * 
 * This processor:
 * 1. Receives image URL, mask data, and prompt
 * 2. Calls OpenAI's image editing API (or similar service)
 * 3. Stores the result and updates the job status
 */
export async function processImageInpainting(job: Job<ImageInpaintingJobData>) {
  const { imageId, imageUrl, maskData, prompt, organizationId } = job.data;

  try {
    // Update job status to processing
    await job.updateProgress(10);

    // Initialize OpenAI client
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    await job.updateProgress(20);

    // Download original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    await job.updateProgress(40);

    // Convert mask data URL to buffer
    // maskData is a base64 data URL (e.g., "data:image/png;base64,...")
    const maskBase64 = maskData.split(',')[1]; // Remove data URL prefix
    const maskBuffer = Buffer.from(maskBase64, 'base64');

    await job.updateProgress(50);

    // Call OpenAI image editing API
    // Note: OpenAI's image editing API requires:
    // - Original image (PNG, up to 4MB)
    // - Mask image (PNG, same dimensions, white = area to edit)
    // - Prompt describing what to generate
    const response = await openai.images.edit({
      image: new File([imageBuffer], 'image.png', { type: 'image/png' }),
      mask: new File([maskBuffer], 'mask.png', { type: 'image/png' }),
      prompt: prompt,
      n: 1,
      size: '1024x1024', // Can be made configurable
    });

    await job.updateProgress(80);

    // Get the result URL
    const resultUrl = response.data[0]?.url;
    if (!resultUrl) {
      throw new Error('No result URL returned from OpenAI');
    }

    // Store result in database
    // Update the asset record with the inpainted image
    await prisma.asset.update({
      where: { id: imageId },
      data: {
        metadata: {
          ...((await prisma.asset.findUnique({ where: { id: imageId } }))?.metadata as Record<string, unknown> || {}),
          inpaintedUrl: resultUrl,
          inpaintingJobId: job.id,
          inpaintingCompletedAt: new Date(),
        },
      },
    });

    await job.updateProgress(100);

    return {
      status: 'completed',
      resultUrl,
      jobId: job.id,
    };
  } catch (error) {
    console.error('Error processing image inpainting:', error);
    
    // Update job with error
    await job.updateProgress(0);
    
    throw new Error(
      `Image inpainting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
