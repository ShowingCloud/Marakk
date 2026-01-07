'use client';

import { useState } from 'react';
import type { PromptAugmentation, PromptTone, PromptFormat, PromptTemplate } from '../lib/prompt-types';
import { PROMPT_TEMPLATES } from '../lib/prompt-types';

export interface PromptBuilderProps {
  initialPrompt?: string;
  onBuild: (augmentation: PromptAugmentation) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * PromptBuilder - Structured prompt input UI
 * Allows users to select tone, format, and inject context
 */
export function PromptBuilder({ initialPrompt = '', onBuild, onCancel, className }: PromptBuilderProps) {
  const [basePrompt, setBasePrompt] = useState(initialPrompt);
  const [tone, setTone] = useState<PromptTone | undefined>(undefined);
  const [format, setFormat] = useState<PromptFormat | undefined>(undefined);
  const [maxLength, setMaxLength] = useState<number | undefined>(undefined);
  const [includeExamples, setIncludeExamples] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setTone(template.tone);
    setFormat(template.format);
    if (template.example && !basePrompt) {
      setBasePrompt(template.example);
    }
  };

  const handleSubmit = () => {
    if (!basePrompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    const augmentation: PromptAugmentation = {
      basePrompt: basePrompt.trim(),
      tone,
      format,
      maxLength,
      includeExamples,
      context: selectedTemplate ? {
        metadata: {
          templateId: selectedTemplate.id,
        },
      } : undefined,
    };

    onBuild(augmentation);
  };

  return (
    <div className={`bg-white border border-gray-300 rounded-lg shadow-lg p-4 ${className || ''}`}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prompt Templates
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PROMPT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`p-2 text-left border rounded-md text-xs transition-colors ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{template.name}</div>
              <div className="text-gray-500 text-xs mt-1">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Prompt *
        </label>
        <textarea
          value={basePrompt}
          onChange={(e) => setBasePrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone
          </label>
          <select
            value={tone || ''}
            onChange={(e) => setTone(e.target.value as PromptTone || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Default</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="witty">Witty</option>
            <option value="academic">Academic</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="creative">Creative</option>
            <option value="technical">Technical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <select
            value={format || ''}
            onChange={(e) => setFormat(e.target.value as PromptFormat || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Default</option>
            <option value="paragraph">Paragraph</option>
            <option value="bullet-points">Bullet Points</option>
            <option value="table">Table</option>
            <option value="list">List</option>
            <option value="code">Code</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-600 hover:text-blue-800 mb-2"
      >
        {showAdvanced ? '▼' : '▶'} Advanced Options
      </button>

      {showAdvanced && (
        <div className="mb-4 space-y-3 p-3 bg-gray-50 rounded-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Length (characters)
            </label>
            <input
              type="number"
              value={maxLength || ''}
              onChange={(e) => setMaxLength(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="include-examples"
              checked={includeExamples}
              onChange={(e) => setIncludeExamples(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="include-examples" className="text-sm text-gray-700">
              Include examples in response
            </label>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!basePrompt.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Build Prompt
        </button>
      </div>
    </div>
  );
}

