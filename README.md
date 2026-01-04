# Algedi AI

Unified AI Editor and Service for the Algedi Multi-Tenant E-Commerce Platform. This repository contains both the React-based AI Editor library and the backend AI service.

## Structure

This is a monorepo containing:

- **`packages/ai-editor`** - React library for AI-powered page generation
- **`apps/ai-service`** - Backend service for AI operations (image description, page generation, token tracking)

## Features

### AI Editor (`packages/ai-editor`)
- React library for AI-powered page generation
- Click-to-Data mechanism for visual editing
- Shadow DOM isolation
- Stateless and framework-agnostic
- `useVisualEditor` hook for element selection

### AI Service (`apps/ai-service`)
- Express.js API server
- OpenAI integration for image description
- Redis queue for async job processing
- Token usage tracking for billing
- Background worker for image analysis

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd packages/ai

# Install dependencies
pnpm install
```

## Development

### Run Everything

```bash
# Start both editor and service
pnpm dev
```

### Run Individual Services

```bash
# Editor only (watch mode)
pnpm dev:editor

# Service API only
pnpm dev:service

# Worker process (in separate terminal)
pnpm dev:worker
```

## Usage

### As a Package

Install the editor package:

```bash
pnpm add @algedi/ai-editor
```

```tsx
import { AIEditor, useVisualEditor } from "@algedi/ai-editor";

<AIEditor
  tenantId="your-tenant-id"
  onCodeGenerated={(code) => console.log(code)}
/>
```

### As a Service

The AI service runs as a standalone Express server:

```bash
cd apps/ai-service
pnpm dev
```

API endpoints:
- `POST /api/ai/describe` - Queue image description job
- `GET /api/ai/job/:jobId` - Check job status

## Architecture

See the [architecture documentation](../../docs/architecture/) for details on:
- Async Image Pipeline
- Click-to-Data Mechanism
- Output Format

## Project Structure

```
packages/ai/
├── packages/
│   └── ai-editor/          # React library
│       ├── src/
│       │   ├── components/ # AIEditor component
│       │   ├── hooks/      # useVisualEditor hook
│       │   └── types/      # TypeScript types
│       └── package.json
├── apps/
│   └── ai-service/         # Backend service
│       ├── src/
│       │   ├── index.ts    # Express API server
│       │   └── worker.ts   # Background worker
│       └── package.json
├── package.json            # Root workspace config
├── pnpm-workspace.yaml     # Workspace definition
└── README.md
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Related Projects

- [Algedi CMS](../../apps/cms) - Frontend CMS application
- [Algedi Commerce Core](../../apps/commerce-core) - Commerce API
