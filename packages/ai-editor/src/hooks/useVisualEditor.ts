import { useCallback, useEffect, useRef, useState } from "react";
import type { SourceLocation, SelectedElement } from "../types";

/**
 * Options for useVisualEditor hook
 */
export interface UseVisualEditorOptions {
  /**
   * Whether the editor is in development mode (enables click-to-select)
   * @default process.env.NODE_ENV === "development"
   */
  enabled?: boolean;
  /**
   * Callback when an element is selected
   */
  onElementSelected?: (selected: SelectedElement | null) => void;
  /**
   * Custom highlight style
   */
  highlightStyle?: Partial<CSSStyleDeclaration>;
}

/**
 * Parse data-source-loc attribute into SourceLocation
 * Format: "file.tsx:line:col"
 */
function parseSourceLocation(attrValue: string): SourceLocation | null {
  const match = attrValue.match(/^(.+?):(\d+):(\d+)$/);
  if (!match) {
    return null;
  }

  const [, file, lineStr, colStr] = match;
  const line = parseInt(lineStr, 10);
  const column = parseInt(colStr, 10);

  if (isNaN(line) || isNaN(column)) {
    return null;
  }

  return {
    file,
    line,
    column,
    full: attrValue,
  };
}

/**
 * Find the closest element with data-source-loc attribute
 */
function findSourceElement(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;

  while (current) {
    if (current.hasAttribute("data-source-loc")) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Apply highlight styles to an element
 */
function highlightElement(
  element: HTMLElement,
  style: Partial<CSSStyleDeclaration> = {}
): void {
  const defaultStyle: Partial<CSSStyleDeclaration> = {
    outline: "2px solid #0070f3",
    outlineOffset: "2px",
    backgroundColor: "rgba(0, 112, 243, 0.1)",
    cursor: "pointer",
  };

  Object.assign(element.style, defaultStyle, style);
}

/**
 * Remove highlight styles from an element
 */
function removeHighlight(element: HTMLElement): void {
  element.style.outline = "";
  element.style.outlineOffset = "";
  element.style.backgroundColor = "";
  element.style.cursor = "";
}

/**
 * React hook for implementing the "Click-to-Data" mechanism.
 * Handles selection of DOM elements inside a Shadow Root and identifies their source.
 *
 * @param shadowRoot - Reference to the ShadowRoot containing the preview
 * @param options - Configuration options
 * @returns Object with selection state and methods
 */
export function useVisualEditor(
  shadowRoot: ShadowRoot | null,
  options: UseVisualEditorOptions = {}
) {
  const {
    enabled = process.env.NODE_ENV === "development",
    onElementSelected,
    highlightStyle,
  } = options;

  const [selectedElement, setSelectedElement] =
    useState<SelectedElement | null>(null);
  const previousHighlightRef = useRef<HTMLElement | null>(null);

  /**
   * Clear the current selection
   */
  const clearSelection = useCallback(() => {
    if (previousHighlightRef.current) {
      removeHighlight(previousHighlightRef.current);
      previousHighlightRef.current = null;
    }
    setSelectedElement(null);
    onElementSelected?.(null);
  }, [onElementSelected]);

  /**
   * Select an element and extract its source location
   */
  const selectElement = useCallback(
    (element: HTMLElement) => {
      if (!shadowRoot || !enabled) {
        return;
      }

      // Clear previous highlight
      if (previousHighlightRef.current) {
        removeHighlight(previousHighlightRef.current);
      }

      // Find element with data-source-loc
      const sourceElement = findSourceElement(element);
      if (!sourceElement) {
        clearSelection();
        return;
      }

      // Extract source location
      const sourceLocAttr = sourceElement.getAttribute("data-source-loc");
      if (!sourceLocAttr) {
        clearSelection();
        return;
      }

      const sourceLocation = parseSourceLocation(sourceLocAttr);
      if (!sourceLocation) {
        clearSelection();
        return;
      }

      // Apply highlight
      highlightElement(sourceElement, highlightStyle);
      previousHighlightRef.current = sourceElement;

      // Create selected element info
      const selected: SelectedElement = {
        element: sourceElement,
        sourceLocation,
        shadowRoot,
      };

      setSelectedElement(selected);
      onElementSelected?.(selected);
    },
    [shadowRoot, enabled, highlightStyle, onElementSelected, clearSelection]
  );

  /**
   * Handle click events inside the shadow root
   */
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !shadowRoot) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const target = event.target as HTMLElement;
      if (target) {
        selectElement(target);
      }
    },
    [enabled, shadowRoot, selectElement]
  );

  // Set up event listeners
  useEffect(() => {
    if (!shadowRoot || !enabled) {
      return;
    }

    // Add click listener to shadow root
    shadowRoot.addEventListener("click", handleClick);

    return () => {
      shadowRoot.removeEventListener("click", handleClick);
      // Clean up highlight on unmount
      if (previousHighlightRef.current) {
        removeHighlight(previousHighlightRef.current);
      }
    };
  }, [shadowRoot, enabled, handleClick]);

  return {
    /**
     * Currently selected element with source location
     */
    selectedElement,
    /**
     * Select an element programmatically
     */
    selectElement,
    /**
     * Clear the current selection
     */
    clearSelection,
    /**
     * Whether the editor is enabled
     */
    enabled,
  };
}

