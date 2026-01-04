/**
 * Source location information extracted from data-source-loc attribute
 */
export interface SourceLocation {
  /**
   * File path (e.g., "components/HeroSection.tsx")
   */
  file: string;
  /**
   * Line number (1-indexed)
   */
  line: number;
  /**
   * Column number (1-indexed)
   */
  column: number;
  /**
   * Full source location string (e.g., "components/HeroSection.tsx:42:15")
   */
  full: string;
}

/**
 * Selected element information
 */
export interface SelectedElement {
  /**
   * The DOM element that was selected
   */
  element: HTMLElement;
  /**
   * Source location if available
   */
  sourceLocation: SourceLocation | null;
  /**
   * The shadow root containing the element
   */
  shadowRoot: ShadowRoot;
}

