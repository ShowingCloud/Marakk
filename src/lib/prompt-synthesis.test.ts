import { describe, it, expect } from 'vitest';
import {
  synthesizeSystemPrompt,
  synthesizeUserPrompt,
  buildPromptPair,
} from './prompt-synthesis';
import type { PromptAugmentation } from './prompt-types';

describe('Prompt Synthesis', () => {
  describe('synthesizeSystemPrompt', () => {
    it('should create basic system prompt', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
      };

      const result = synthesizeSystemPrompt(augmentation);

      expect(result).toContain('expert AI assistant');
      expect(result).toContain('high-quality content');
    });

    it('should include tone instruction', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        tone: 'professional',
      };

      const result = synthesizeSystemPrompt(augmentation);

      expect(result).toContain('professional');
      expect(result).toContain('business-appropriate');
    });

    it('should include format instruction', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        format: 'bullet-points',
      };

      const result = synthesizeSystemPrompt(augmentation);

      expect(result).toContain('bulleted list');
    });

    it('should include max length constraint', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        maxLength: 500,
      };

      const result = synthesizeSystemPrompt(augmentation);

      expect(result).toContain('500 characters');
    });

    it('should include language instruction for non-English', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        language: 'es',
      };

      const result = synthesizeSystemPrompt(augmentation);

      expect(result).toContain('Respond in es');
    });

    it('should not include language instruction for English', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        language: 'en',
      };

      const result = synthesizeSystemPrompt(augmentation);

      expect(result).not.toContain('Respond in en');
    });

    it('should include context awareness instructions', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        context: {
          previousDocuments: ['doc1', 'doc2'],
          assets: ['asset1'],
          relatedPrompts: ['prompt1'],
        },
      };

      const result = synthesizeSystemPrompt(augmentation);

      expect(result).toContain('previous documents');
      expect(result).toContain('assets');
      expect(result).toContain('related prompts');
    });

    it('should include example instruction when requested', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        includeExamples: true,
      };

      const result = synthesizeSystemPrompt(augmentation);

      expect(result).toContain('examples');
    });

    it('should combine all instructions', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        tone: 'professional',
        format: 'markdown',
        maxLength: 1000,
        language: 'en',
        includeExamples: true,
      };

      const result = synthesizeSystemPrompt(augmentation);

      expect(result).toContain('professional');
      expect(result).toContain('Markdown');
      expect(result).toContain('1000 characters');
      expect(result).toContain('examples');
    });
  });

  describe('synthesizeUserPrompt', () => {
    it('should include base prompt', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description for a laptop',
      };

      const result = synthesizeUserPrompt(augmentation);

      expect(result).toContain('Generate a product description for a laptop');
    });

    it('should inject context data with products', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
      };

      const contextData = {
        products: [
          { id: '1', name: 'Laptop', price: 999 },
          { id: '2', name: 'Mouse', price: 29 },
        ],
      };

      const result = synthesizeUserPrompt(augmentation, contextData);

      expect(result).toContain('Context:');
      expect(result).toContain('Available products');
      expect(result).toContain('Laptop');
      expect(result).toContain('Mouse');
    });

    it('should inject tenant context', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
      };

      const contextData = {
        tenantId: 'tenant-123',
      };

      const result = synthesizeUserPrompt(augmentation, contextData);

      expect(result).toContain('Tenant context: tenant-123');
    });

    it('should include context from augmentation', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        context: {
          previousDocuments: ['doc1', 'doc2'],
          assets: ['asset1'],
          relatedPrompts: ['prompt1'],
        },
      };

      const result = synthesizeUserPrompt(augmentation);

      expect(result).toContain('Additional context:');
      expect(result).toContain('Previous documents: 2 referenced');
      expect(result).toContain('Assets: 1 referenced');
      expect(result).toContain('Related prompts: 1 referenced');
    });

    it('should combine base prompt, context data, and augmentation context', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        context: {
          previousDocuments: ['doc1'],
        },
      };

      const contextData = {
        products: [{ id: '1', name: 'Laptop' }],
        tenantId: 'tenant-123',
      };

      const result = synthesizeUserPrompt(augmentation, contextData);

      expect(result).toContain('Generate a product description');
      expect(result).toContain('Context:');
      expect(result).toContain('Available products');
      expect(result).toContain('Tenant context');
      expect(result).toContain('Additional context:');
      expect(result).toContain('Previous documents');
    });
  });

  describe('buildPromptPair', () => {
    it('should build complete prompt pair', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        tone: 'professional',
        format: 'markdown',
      };

      const result = buildPromptPair(augmentation);

      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('user');
      expect(result.system).toContain('professional');
      expect(result.system).toContain('Markdown');
      expect(result.user).toContain('Generate a product description');
    });

    it('should include context data in user prompt', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
      };

      const contextData = {
        products: [{ id: '1', name: 'Laptop' }],
      };

      const result = buildPromptPair(augmentation, contextData);

      expect(result.user).toContain('Available products');
      expect(result.user).toContain('Laptop');
    });

    it('should combine all augmentation features', () => {
      const augmentation: PromptAugmentation = {
        basePrompt: 'Generate a product description',
        tone: 'casual',
        format: 'bullet-points',
        maxLength: 500,
        includeExamples: true,
        context: {
          assets: ['asset1'],
        },
      };

      const result = buildPromptPair(augmentation);

      expect(result.system).toContain('casual');
      expect(result.system).toContain('bulleted list');
      expect(result.system).toContain('500 characters');
      expect(result.system).toContain('examples');
      expect(result.user).toContain('Generate a product description');
      expect(result.user).toContain('Assets: 1 referenced');
    });
  });
});
