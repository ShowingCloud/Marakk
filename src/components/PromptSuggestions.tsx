'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RelatedPrompt } from '../server/services/prompt-service';

export interface PromptSuggestionsProps {
  currentPrompt: string;
  organizationId: string;
  onSelectPrompt: (prompt: string) => void;
  maxSuggestions?: number;
  className?: string;
}

/**
 * PromptSuggestions - Displays semantically related prompts
 * Uses semantic search to find similar prompts from history
 */
export function PromptSuggestions({
  currentPrompt,
  organizationId,
  onSelectPrompt,
  maxSuggestions = 5,
  className,
}: PromptSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<RelatedPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!currentPrompt.trim() || currentPrompt.length < 10) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-editor/prompts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryPrompt: currentPrompt,
          organizationId,
          limit: maxSuggestions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search prompts');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching prompt suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPrompt, organizationId, maxSuggestions]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [fetchSuggestions]);

  if (loading && suggestions.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className || ''}`}>
        Searching for similar prompts...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-500 ${className || ''}`}>
        Error: {error}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="text-xs font-medium text-gray-600 mb-2">
        Related Prompts ({suggestions.length})
      </div>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelectPrompt(suggestion.prompt)}
          className="w-full text-left p-2 text-sm border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-gray-700 truncate">{suggestion.prompt}</div>
              {suggestion.response && (
                <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {suggestion.response}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">
              {Math.round(suggestion.similarity * 100)}% match
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

