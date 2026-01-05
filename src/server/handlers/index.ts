import { NextRequest, NextResponse } from 'next/server';

// Configuration interface allows Host to inject secrets
export type AIConfig = {
  apiKey?: string;
  redisUrl?: string;
  webhookSecret?: string;
};

// Route Factory Pattern
// The Host App will call this factory and mount the handlers
export function createAIHandler(config: AIConfig) {
  return {
    POST: async (req: NextRequest) => {
      // Route handler implementation
      // This will be called when the host mounts it at app/api/ai/[...slug]/route.ts
      return NextResponse.json({ message: 'AI handler - to be implemented' });
    },
    GET: async (req: NextRequest) => {
      return NextResponse.json({ status: 'active', service: 'ai-editor' });
    },
  };
}

