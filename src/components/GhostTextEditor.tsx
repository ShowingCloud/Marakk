'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history } from 'prosemirror-history';
import { createGhostTextPlugin, acceptSuggestion, getActiveSuggestion, ghostTextPluginKey, type GhostSuggestion } from '../lib/decorations';

// Create a schema with list support
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks,
});

interface GhostTextEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSuggestionRequest?: (text: string, position: number) => Promise<string | null>;
  placeholder?: string;
  className?: string;
}

/**
 * Ghost Text Editor
 * A ProseMirror-based editor with AI-powered inline text suggestions
 * 
 * Features:
 * - Ghost text suggestions appear as gray, italic text
 * - Tab to accept suggestions
 * - Undo-safe suggestion handling
 * - Widget decorations for visual feedback
 */
export function GhostTextEditor({
  initialContent = '',
  onContentChange,
  onSuggestionRequest,
  placeholder = 'Start typing...',
  className = '',
}: GhostTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Create initial state
    const state = EditorState.create({
      doc: DOMParser.fromSchema(mySchema).parse(editorRef.current),
      plugins: [
        history(),
        createGhostTextPlugin(),
        keymap({
          Tab: (state, dispatch) => {
            // Accept suggestion on Tab
            const activeSuggestion = getActiveSuggestion(state);
            if (activeSuggestion) {
              if (dispatch) {
                const { state: newState } = acceptSuggestion(state, activeSuggestion.id);
                dispatch(newState.tr);
              }
              return true; // Prevent default Tab behavior
            }
            return false; // Allow default Tab behavior if no suggestion
          },
          Escape: (state, dispatch) => {
            // Dismiss suggestion on Escape
            const activeSuggestion = getActiveSuggestion(state);
            if (activeSuggestion) {
              // Remove the suggestion
              const tr = state.tr;
              tr.setMeta('ghostText', { action: 'remove', id: activeSuggestion.id });
              if (dispatch) dispatch(tr);
              return true;
            }
            return false;
          },
        }),
        keymap(baseKeymap),
      ],
    });

    // Create view
    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        // Notify content change
        if (onContentChange) {
          const content = newState.doc.textContent;
          onContentChange(content);
        }

        // Request suggestion after user stops typing
        if (transaction.docChanged && onSuggestionRequest) {
          // Clear existing timeout
          if (suggestionTimeoutRef.current) {
            clearTimeout(suggestionTimeoutRef.current);
          }

          // Request suggestion after 500ms of no typing
          suggestionTimeoutRef.current = setTimeout(() => {
            requestSuggestion(newState);
          }, 500);
        }
      },
    });

    viewRef.current = view;

    // Set initial content if provided
    if (initialContent) {
      const tr = view.state.tr;
      tr.replaceWith(0, view.state.doc.content.size, mySchema.text(initialContent));
      view.dispatch(tr);
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      view.destroy();
    };
  }, []); // Only run once on mount

  // Request suggestion from AI
  const requestSuggestion = useCallback(async (state: EditorState) => {
    if (!onSuggestionRequest || !viewRef.current) return;

    const { selection } = state;
    const textBeforeCursor = state.doc.textBetween(
      Math.max(0, selection.$anchor.pos - 100),
      selection.$anchor.pos
    );
    const cursorPosition = selection.$anchor.pos;

    setIsLoadingSuggestion(true);

    try {
      const suggestion = await onSuggestionRequest(textBeforeCursor, cursorPosition);
      
      if (suggestion && viewRef.current) {
        // Add suggestion to editor
        const newState = viewRef.current.state;
        const suggestionObj: GhostSuggestion = {
          from: cursorPosition,
          to: cursorPosition,
          text: suggestion,
          id: `suggestion-${Date.now()}-${Math.random()}`,
        };

        // Use the plugin's addSuggestion function
        const tr = newState.tr;
        tr.setMeta(ghostTextPluginKey, { action: 'add', suggestion: suggestionObj });
        viewRef.current.dispatch(tr);
      }
    } catch (error) {
      console.error('Error requesting suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [onSuggestionRequest]);

  return (
    <div className={`ghost-text-editor-wrapper ${className}`}>
      <div
        ref={editorRef}
        className="prosemirror-editor"
        style={{
          minHeight: '200px',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          outline: 'none',
        }}
      />
      {isLoadingSuggestion && (
        <div className="suggestion-loading" style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
          AI is thinking...
        </div>
      )}
      <style jsx>{`
        .prosemirror-editor :global(.ghost-text-suggestion) {
          color: #9ca3af;
          font-style: italic;
          opacity: 0.6;
          cursor: pointer;
        }
        .prosemirror-editor :global(.ghost-text-suggestion:hover) {
          opacity: 0.8;
        }
        .prosemirror-editor :global(p) {
          margin: 0.5em 0;
        }
        .prosemirror-editor :global(p:first-child) {
          margin-top: 0;
        }
        .prosemirror-editor :global(p:last-child) {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
