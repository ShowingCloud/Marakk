# AI Editor Package

A stateless React library for AI-powered page generation.

## Rules

- **NEVER** imports from CMS or Commerce Backend
- **Responsibility**: Takes JSON/Images -> Returns React Code
- **Tech**: React, Shadow DOM, Zod, OpenAI SDK

## Usage

```tsx
import { AIEditor } from "@algedi/ai-editor";

<AIEditor
  tenantId="your-tenant-id"
  onCodeGenerated={(code) => console.log(code)}
/>
```

