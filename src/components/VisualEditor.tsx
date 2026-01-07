'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ShadowRoot from 'react-shadow';
import { SelectionOverlay } from './SelectionOverlay';

export interface VisualEditorProps {
  initialData?: unknown; // JSON schema or component tree
  onGenerate?: (componentId: string, prompt: string) => Promise<void>;
  className?: string;
}

/**
 * VisualEditor - The main AI-powered visual editor component
 * Uses Shadow DOM for style isolation and implements click-to-edit functionality
 */
export function VisualEditor({ initialData, onGenerate, className }: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  /**
   * Handle click events inside the Shadow DOM
   * Stops propagation and extracts data-component-id
   */
  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const target = event.target as HTMLElement;
      
      // Traverse up the DOM tree to find data-component-id
      let element: HTMLElement | null = target;
      let componentId: string | null = null;

      while (element && !componentId) {
        componentId = element.getAttribute('data-component-id');
        if (!componentId) {
          element = element.parentElement;
        }
      }

      if (componentId && element) {
        console.log('Clicked component ID:', componentId);
        setSelectedComponentId(componentId);
        setSelectedElement(element);
      }
    },
    []
  );

  // Attach click handler to shadow root when ready
  useEffect(() => {
    if (!shadowRootRef.current) {
      return;
    }

    const root = shadowRootRef.current;
    root.addEventListener('click', handleClick as EventListener, true); // Use capture phase

    return () => {
      root.removeEventListener('click', handleClick as EventListener, true);
    };
  }, [handleClick]);

  return (
    <div className={className} ref={shadowHostRef} style={{ position: 'relative' }}>
      <ShadowRoot.div
        onShadowRootReady={(root) => {
          shadowRootRef.current = root;
        }}
      >
        <style>
          {`
            /* Reset and base styles for the editor content */
            * {
              box-sizing: border-box;
            }
          `}
        </style>
        {/* Render the initial data/content here */}
        <div id="editor-content">
          {initialData ? (
            <div
              dangerouslySetInnerHTML={{
                __html: typeof initialData === 'string' ? initialData : JSON.stringify(initialData),
              }}
            />
          ) : (
            <div data-component-id="editor:root:1">
              <p>Click on any element to select it for AI editing</p>
            </div>
          )}
        </div>
        {/* Selection overlay rendered inside shadow root */}
        {shadowRootRef.current && selectedElement && (
          <SelectionOverlay selectedElement={selectedElement} shadowRoot={shadowRootRef.current} />
        )}
      </ShadowRoot.div>
    </div>
  );
}

