import { createClient } from "ioredis";
import OpenAI from "openai";

const redis = createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function processImageDescription() {
  await redis.connect();

  while (true) {
    const jobData = await redis.brpop("ai:image-description-queue", 5);

    if (!jobData) {
      continue;
    }

    try {
      const job = JSON.parse(jobData[1]);
      const { jobId, url, tenantId } = job;

      console.log(`Processing job ${jobId} for tenant ${tenantId}`);

      // Call OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this image in detail for use in generating an e-commerce product page.",
              },
              {
                type: "image_url",
                image_url: { url },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const description = response.choices[0]?.message?.content || "";
      const tokensUsed = response.usage?.total_tokens || 0;

      // Store result
      await redis.set(
        `ai:job:${jobId}`,
        JSON.stringify({
          jobId,
          status: "completed",
          description,
          tokensUsed,
          tenantId,
        }),
        "EX",
        3600
      );

      // TODO: Write to AssetDescription table via Prisma
      console.log(`Job ${jobId} completed`);
    } catch (error) {
      console.error("Error processing job:", error);
    }
  }
}

processImageDescription().catch(console.error);

