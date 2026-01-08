import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorState } from 'prosemirror-state';

/**
 * Ghost Text Suggestion
 * Represents an AI-generated text suggestion that appears as "ghost text"
 */
export interface GhostSuggestion {
  from: number; // Start position in the document
  to: number; // End position (where the suggestion should be inserted)
  text: string; // The suggested text
  id: string; // Unique ID for this suggestion
}

/**
 * Plugin key for the ghost text plugin
 */
export const ghostTextPluginKey = new PluginKey('ghostText');

/**
 * Create a decoration for ghost text
 * Ghost text appears as gray, italic text that can be accepted with Tab
 */
function createGhostTextDecoration(suggestion: GhostSuggestion): Decoration {
  return Decoration.inline(suggestion.from, suggestion.to, {
    class: 'ghost-text-suggestion',
    style: 'color: #9ca3af; font-style: italic; opacity: 0.6;',
    'data-suggestion-id': suggestion.id,
  });
}

/**
 * Create decorations for all active suggestions
 */
export function createGhostTextDecorations(doc: any, suggestions: GhostSuggestion[]): DecorationSet {
  const decorations = suggestions.map((suggestion) => createGhostTextDecoration(suggestion));
  return DecorationSet.create(doc, decorations);
}

/**
 * Ghost Text Plugin
 * Manages the display of AI suggestions as ghost text
 */
export function createGhostTextPlugin() {
  let suggestions: GhostSuggestion[] = [];

  return new Plugin({
    key: ghostTextPluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, set, oldState, newState) {
        // Update decorations when suggestions change
        const meta = tr.getMeta(ghostTextPluginKey);
        if (meta) {
          if (meta.suggestions) {
            suggestions = meta.suggestions;
            return createGhostTextDecorations(newState.doc, suggestions);
          }
          if (meta.action === 'add' && meta.suggestion) {
            suggestions = [...suggestions, meta.suggestion];
            return createGhostTextDecorations(newState.doc, suggestions);
          }
          if (meta.action === 'remove' && meta.id) {
            suggestions = suggestions.filter((s) => s.id !== meta.id);
            return createGhostTextDecorations(newState.doc, suggestions);
          }
        }

        // Map decorations through transactions (for undo/redo)
        return set.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        const pluginState = ghostTextPluginKey.getState(state);
        return pluginState || DecorationSet.empty;
      },
    },
  });
}

/**
 * Add a suggestion to the editor
 */
export function addSuggestion(state: EditorState, suggestion: GhostSuggestion): EditorState {
  const tr = state.tr;
  const currentSuggestions = ghostTextPluginKey.getState(state)?.find() || [];
  
  // Remove any existing suggestion at the same position
  const filteredSuggestions = currentSuggestions
    .map((dec) => dec.spec)
    .filter((spec) => {
      const existingFrom = spec['data-suggestion-from'] as number | undefined;
      return existingFrom !== suggestion.from;
    });

  // Add new suggestion
  const newSuggestions: GhostSuggestion[] = [
    ...filteredSuggestions.map((spec) => ({
      from: spec['data-suggestion-from'] as number,
      to: spec['data-suggestion-to'] as number,
      text: spec['data-suggestion-text'] as string,
      id: spec['data-suggestion-id'] as string,
    })),
    suggestion,
  ];

  tr.setMeta(ghostTextPluginKey, { suggestions: newSuggestions });
  return state.apply(tr);
}

/**
 * Remove a suggestion by ID
 */
export function removeSuggestion(state: EditorState, suggestionId: string): EditorState {
  const tr = state.tr;
  const currentSuggestions = ghostTextPluginKey.getState(state)?.find() || [];
  
  const filteredSuggestions = currentSuggestions
    .map((dec) => dec.spec)
    .filter((spec) => {
      const id = spec['data-suggestion-id'] as string;
      return id !== suggestionId;
    })
    .map((spec) => ({
      from: spec['data-suggestion-from'] as number,
      to: spec['data-suggestion-to'] as number,
      text: spec['data-suggestion-text'] as string,
      id: spec['data-suggestion-id'] as string,
    }));

  tr.setMeta(ghostTextPluginKey, { suggestions: filteredSuggestions });
  return state.apply(tr);
}

/**
 * Accept a suggestion (insert the text)
 */
export function acceptSuggestion(
  state: EditorState,
  suggestionId: string
): { state: EditorState; suggestion: GhostSuggestion | null } {
  const decorations = ghostTextPluginKey.getState(state);
  if (!decorations) {
    return { state, suggestion: null };
  }

  // Find the suggestion
  const suggestionDec = decorations.find().find((dec) => {
    const spec = dec.spec;
    return spec['data-suggestion-id'] === suggestionId;
  });

  if (!suggestionDec) {
    return { state, suggestion: null };
  }

  const suggestion: GhostSuggestion = {
    from: suggestionDec.from,
    to: suggestionDec.to,
    text: suggestionDec.spec['data-suggestion-text'] as string,
    id: suggestionDec.spec['data-suggestion-id'] as string,
  };

  // Insert the text
  const tr = state.tr;
  tr.insertText(suggestion.text, suggestion.from, suggestion.to);

  // Remove the suggestion
  const newState = removeSuggestion(state.apply(tr), suggestionId);

  return { state: newState, suggestion };
}

/**
 * Get the active suggestion at the current cursor position
 */
export function getActiveSuggestion(state: EditorState): GhostSuggestion | null {
  const decorations = ghostTextPluginKey.getState(state);
  if (!decorations) {
    return null;
  }

  const { selection } = state;
  const cursorPos = selection.$anchor.pos;

  const suggestionDec = decorations.find().find((dec) => {
    return dec.from <= cursorPos && cursorPos <= dec.to;
  });

  if (!suggestionDec) {
    return null;
  }

  return {
    from: suggestionDec.from,
    to: suggestionDec.to,
    text: suggestionDec.spec['data-suggestion-text'] as string,
    id: suggestionDec.spec['data-suggestion-id'] as string,
  };
}
