# Contributing to Algedi AI Service

Thank you for your interest in contributing to Algedi AI Service!

## Development Setup

### Standalone Development

This repository can be developed independently:

```bash
git clone <repository-url>
cd apps/ai-service
pnpm install
npx prisma generate
pnpm dev
# In another terminal
pnpm worker
```

### Monorepo Development

When used as a git submodule in a Turborepo monorepo:

1. The root `package.json` may override dependencies using workspace protocol
2. Use `pnpm install` from the monorepo root
3. Run commands with Turbo: `pnpm dev --filter @algedi/ai-service`

## Token Usage Tracking

⚠️ **IMPORTANT**: All AI operations must track token usage for billing. Ensure `tokens_used` is recorded in the `PromptLog` table.

## Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Always track token usage
- Run `pnpm lint` before committing
- Run `pnpm type-check` to ensure type safety

## Testing

When adding new features:

1. Test with actual OpenAI API (use test API key)
2. Verify token counting is accurate
3. Test queue processing
4. Ensure error handling is robust

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure token usage is tracked
5. Test with real API calls
6. Submit a pull request with a clear description

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

