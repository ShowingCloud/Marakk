# Setup Guide

This guide explains how to set up Algedi AI Service in different environments.

## Standalone Setup

This is the default setup when cloning this repository directly.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apps/ai-service
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Prisma** (if using database)
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   # IMPORTANT: Add your OPENAI_API_KEY
   ```

5. **Start API server**
   ```bash
   pnpm dev
   ```

6. **Start worker** (in separate terminal)
   ```bash
   pnpm worker
   ```

## Monorepo Setup (Git Submodule)

When this repository is used as a git submodule in a Turborepo monorepo:

1. **Add as submodule** (from monorepo root)
   ```bash
   git submodule add <repository-url> apps/ai-service
   ```

2. **Install dependencies** (from monorepo root)
   ```bash
   pnpm install
   ```

3. **Run with Turbo**
   ```bash
   # Terminal 1: API server
   pnpm dev --filter @algedi/ai-service
   
   # Terminal 2: Worker
   pnpm worker --filter @algedi/ai-service
   ```

## Dependencies

### Required

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 15.0 (for storing results)
- Redis (for job queue)
- OpenAI API key

## Environment Variables

**Required**:
- `OPENAI_API_KEY` - Your OpenAI API key

**Optional** (with defaults):
- `PORT` - API server port (default: 3001)
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `DATABASE_URL` - PostgreSQL connection string

## Troubleshooting

### OpenAI API Errors

- Verify `OPENAI_API_KEY` is set correctly
- Check API key has sufficient credits
- Ensure API key has access to Vision models

### Redis Connection Errors

- Ensure Redis is running
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`
- Test connection: `redis-cli ping`

### Worker Not Processing Jobs

- Ensure worker process is running
- Check Redis queue: `redis-cli LLEN ai:image-description-queue`
- Review worker logs for errors

### Database Connection Errors

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run `npx prisma generate` if schema changed


