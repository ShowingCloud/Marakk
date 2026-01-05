// Utility functions for the AI Editor package

export function formatPrompt(prompt: string, context?: Record<string, unknown>): string {
  // Format prompt with context
  if (!context) return prompt;
  
  const contextStr = Object.entries(context)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  return `${prompt}\n\nContext:\n${contextStr}`;
}

// Add more utility functions as needed

