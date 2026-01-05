# AI Editor (Marakk)

**Standalone Product 1** - Generative UI, Asset Management, and Prompt Engineering

## Overview

The AI Editor is a standalone Full-Stack Package (FSP) that provides generative UI capabilities, asset management, and prompt engineering features. It is designed to run independently, even if Commerce or CMS packages are missing.

## Responsibilities

- Generative UI components
- Asset Management
- Prompt Engineering
- Asynchronous AI processing (via BullMQ workers)

## Independence

This package must run even if Commerce or CMS are missing. It owns its own data schema (EditorSchema) and can function as a standalone module.

## Architecture

This package follows the **Full-Stack Package (FSP)** pattern:

- **UI Components** - React components (Client and Server)
- **Server Actions** - Next.js Server Actions ('use server')
- **Route Handlers** - API route factories for mounting
- **Workers** - BullMQ workers for async processing
- **Data Schema** - Own Prisma schema with distinct table names

## Data

Owns EditorSchema - manages its own Prisma schema and database client.

**Tables:**
- editor_assets - Asset storage with AI descriptions
- editor_prompt_history - Prompt and generation history

## Installation

\\\ash
pnpm install @repo/ai-editor
\\\

## Usage

### Importing Components

\\\	ypescript
import { VisualEditor } from '@repo/ai-editor/ui';
\\\

### Importing Server Actions

\\\	ypescript
import { generateText } from '@repo/ai-editor/actions';

// In a Server Component or Server Action
const result = await generateText(prompt);
\\\

### Mounting Route Handlers (Host App)

\\\	ypescript
// apps/platform/app/api/ai/[...slug]/route.ts
import { createAIHandler } from '@repo/ai-editor/api';

const handler = createAIHandler({
  apiKey: process.env.OPENAI_API_KEY,
  redisUrl: process.env.REDIS_URL,
});

export const POST = handler.POST;
export const GET = handler.GET;
\\\

### Creating Workers (Host App)

\\\	ypescript
// apps/platform/scripts/start-worker.ts
import { createAIWorker } from '@repo/ai-editor/worker';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);
const worker = createAIWorker(redis);
\\\

## Package Exports

This package uses subpath exports for better tree-shaking:

- @repo/ai-editor - Main entry (components, actions, lib)
- @repo/ai-editor/ui - UI components only
- @repo/ai-editor/api - Route handler factories
- @repo/ai-editor/actions - Server Actions
- @repo/ai-editor/worker - Worker factories
- @repo/ai-editor/types - TypeScript types and Zod schemas

## Development

\\\ash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Build
pnpm build

# Run migrations
pnpm prisma:migrate
\\\

## Dependencies

- **react** - UI components
- **next** - Server Actions and Route Handlers (peer dependency)
- **prisma** - Database ORM
- **zod** - Schema validation
- **bullmq** - Queue management
- **ioredis** - Redis connection
- **server-only** - Prevents server code from leaking to client

## License

MIT License - see [LICENSE](./LICENSE) file for details.
