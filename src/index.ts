import express from "express";
import { z } from "zod";
import { createClient } from "ioredis";

const app = express();
const redis = createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

app.use(express.json());

const describeJobSchema = z.object({
  url: z.string().url(),
  tenantId: z.string().uuid(),
});

// Queue image description job
app.post("/api/ai/describe", async (req, res) => {
  try {
    const { url, tenantId } = describeJobSchema.parse(req.body);
    const jobId = `job:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    await redis.lpush(
      "ai:image-description-queue",
      JSON.stringify({ jobId, url, tenantId })
    );

    res.json({ jobId, status: "queued" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check job status
app.get("/api/ai/job/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await redis.get(`ai:job:${jobId}`);

    if (!result) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(JSON.parse(result));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;

async function start() {
  await redis.connect();
  app.listen(PORT, () => {
    console.log(`AI Service running on port ${PORT}`);
  });
}

start().catch(console.error);

