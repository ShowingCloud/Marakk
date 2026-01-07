'use client';

import { useState, FormEvent } from 'react';

export interface FloatingToolbarProps {
  position: { x: number; y: number };
  componentId: string;
  onGenerate: (prompt: string) => Promise<void>;
  onClose: () => void;
}

/**
 * FloatingToolbar - Appears when an element is selected
 * Allows users to type a prompt and generate AI components
 */
export function FloatingToolbar({ position, componentId, onGenerate, onClose }: FloatingToolbarProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      await onGenerate(prompt);
      setPrompt('');
    } catch (error) {
      console.error('Error generating component:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed z-[10000] bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">Edit: {componentId}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isGenerating}
          autoFocus
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '...' : 'Generate'}
        </button>
      </form>
    </div>
  );
}

