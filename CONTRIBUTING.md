# Contributing to Algedi AI

Thank you for your interest in contributing to Algedi AI!

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (for ai-service)
- Redis (for ai-service)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd packages/ai

# Install dependencies
pnpm install

# Set up environment variables
cp apps/ai-service/.env.example apps/ai-service/.env
# Edit .env with your configuration
```

## Project Structure

```
packages/ai/
├── packages/
│   └── ai-editor/     # React library
├── apps/
│   └── ai-service/    # Backend service
└── package.json       # Root workspace configuration
```

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

3. **Run checks**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm build
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: your feature description"
   ```

5. **Push and create a pull request**

## Code Style

- Use TypeScript for all new code
- Follow existing patterns
- Run `pnpm lint` before committing
- Ensure type safety with `pnpm type-check`

## Package-Specific Guidelines

### AI Editor (`packages/ai-editor`)

- **NEVER** import from CMS or Commerce Backend
- Keep the library stateless
- Use React hooks for state management
- Ensure Shadow DOM compatibility

### AI Service (`apps/ai-service`)

- Always track token usage for billing
- Handle errors gracefully
- Use Zod for input validation
- Follow async job processing patterns

## Testing

- Test with actual OpenAI API (use test API key)
- Verify token counting accuracy
- Test queue processing
- Ensure error handling is robust

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

