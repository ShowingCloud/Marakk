# Setup Guide for Algedi AI

This guide explains how to set up the unified Algedi AI package in different scenarios.

## Standalone Development

When developing this package independently:

```bash
# Clone the repository
git clone <repository-url>
cd packages/ai

# Install dependencies
pnpm install

# Set up environment variables for ai-service
cp apps/ai-service/.env.example apps/ai-service/.env
# Edit apps/ai-service/.env with your configuration

# Run development
pnpm dev
```

## As a Git Submodule

When this package is used as a git submodule in the main Algedi monorepo:

### Initial Setup

```bash
# From the main monorepo root
git submodule add <repository-url> packages/ai
git submodule update --init --recursive
```

### Updating the Submodule

```bash
# From the main monorepo root
cd packages/ai
git pull origin main
cd ../..
git add packages/ai
git commit -m "Update ai submodule"
```

### Cloning with Submodules

```bash
# Clone the main repo with submodules
git clone --recurse-submodules <main-repo-url>

# Or if already cloned
git submodule update --init --recursive
```

## Workspace Configuration

The unified package uses pnpm workspaces. The root `package.json` defines:

- `packages/ai-editor` - React library
- `apps/ai-service` - Backend service

Both can be developed and built independently or together.

## Environment Variables

### AI Service

Create `apps/ai-service/.env`:

```env
PORT=3001
OPENAI_API_KEY=your-key-here
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/algedi
```

## Development Commands

```bash
# Build everything
pnpm build

# Run all services
pnpm dev

# Run editor only
pnpm dev:editor

# Run service only
pnpm dev:service

# Run worker only
pnpm dev:worker
```

## Integration with Main Monorepo

When used as a submodule, the main monorepo's `pnpm-workspace.yaml` should include:

```yaml
packages:
  - "packages/ai/packages/*"
  - "packages/ai/apps/*"
```

This allows the main monorepo to reference packages from the submodule.

## Troubleshooting

### Submodule Not Updating

```bash
git submodule update --remote packages/ai
```

### Workspace Dependencies Not Resolving

Ensure the main monorepo's `pnpm-workspace.yaml` includes the submodule paths.

### Build Errors

Make sure to run `pnpm install` from the unified package root first, then from the main monorepo root.

