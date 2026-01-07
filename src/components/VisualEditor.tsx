'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ShadowRoot from 'react-shadow';
import { SelectionOverlay } from './SelectionOverlay';
import { FloatingToolbar } from './FloatingToolbar';
import { LivePreview } from './LivePreview';
// Note: generateComponentStream is a server action, called via API route

export interface VisualEditorProps {
  initialData?: unknown; // JSON schema or component tree (includes context like products)
  onGenerate?: (componentId: string, prompt: string) => Promise<void>;
  onSave?: (layout: unknown) => Promise<{ success: boolean; message?: string }>;
  className?: string;
}

/**
 * VisualEditor - The main AI-powered visual editor component
 * Uses Shadow DOM for style isolation and implements click-to-edit functionality
 * Integrates with AI streaming and live preview
 */
export function VisualEditor({ initialData, onGenerate, onSave, className }: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Extract context from initialData (products, tenantId, etc.)
  const context = typeof initialData === 'object' && initialData !== null 
    ? (initialData as Record<string, unknown>)
    : {};

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
        
        // Calculate toolbar position (above the selected element)
        const rect = element.getBoundingClientRect();
        setToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      }
    },
    []
  );

  /**
   * Handle AI generation with streaming
   */
  const handleGenerate = useCallback(
    async (prompt: string) => {
      if (!selectedComponentId || !prompt.trim()) return;

      setIsGenerating(true);
      setGeneratedCode('');

      try {
        // Use AI SDK's useCompletion hook for streaming
        // For now, we'll use a fetch-based approach since we need to call our server action
        const response = await fetch('/api/ai-editor/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            componentId: selectedComponentId,
            context,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate component');
        }

        // Stream the response using AI SDK format
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let code = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // Parse AI SDK data stream format
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('0:')) {
                // Text chunk
                try {
                  const data = JSON.parse(line.slice(2));
                  if (data.type === 'text-delta' && data.textDelta) {
                    code += data.textDelta;
                    setGeneratedCode(code);
                  }
                } catch (e) {
                  // If not JSON, treat as plain text
                  if (line.trim()) {
                    code += line;
                    setGeneratedCode(code);
                  }
                }
              } else if (line.trim() && !line.startsWith(':')) {
                // Plain text fallback
                code += line;
                setGeneratedCode(code);
              }
            }
          }
        }

        // Replace the selected element with the live preview
        if (selectedElement && previewContainerRef.current) {
          // Create a container for the live preview
          const container = document.createElement('div');
          container.setAttribute('data-component-id', selectedComponentId);
          previewContainerRef.current.appendChild(container);
        }

        if (onGenerate) {
          await onGenerate(selectedComponentId, prompt);
        }
      } catch (error) {
        console.error('Error generating component:', error);
        alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate component'}`);
      } finally {
        setIsGenerating(false);
      }
    },
    [selectedComponentId, context, selectedElement, onGenerate]
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

  // Close toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarPosition && shadowHostRef.current) {
        const target = event.target as HTMLElement;
        if (!shadowHostRef.current.contains(target)) {
          setToolbarPosition(null);
          setSelectedElement(null);
          setSelectedComponentId(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [toolbarPosition]);

  return (
    <div className={className} ref={shadowHostRef} style={{ position: 'relative' }}>
      {/* Floating Toolbar */}
      {toolbarPosition && selectedComponentId && (
        <FloatingToolbar
          position={toolbarPosition}
          componentId={selectedComponentId}
          onGenerate={handleGenerate}
          onClose={() => {
            setToolbarPosition(null);
            setSelectedElement(null);
            setSelectedComponentId(null);
          }}
        />
      )}

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
            
            .product-list {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
              gap: 1rem;
              padding: 1rem;
            }
            
            .product-item {
              border: 1px solid #e5e7eb;
              border-radius: 0.5rem;
              padding: 1rem;
              background: white;
            }
            
            .product-item h3 {
              margin: 0 0 0.5rem 0;
              font-size: 1.25rem;
              font-weight: 600;
            }
            
            .product-item p {
              margin: 0 0 0.5rem 0;
              color: #6b7280;
            }
            
            .product-item span {
              font-size: 1.125rem;
              font-weight: 600;
              color: #059669;
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
        
        {/* Live Preview Container */}
        {generatedCode && selectedComponentId && (
          <div ref={previewContainerRef}>
            <LivePreview
              code={generatedCode}
              context={context}
              componentId={selectedComponentId}
              onUpdate={(element) => {
                if (element && selectedElement) {
                  // Replace the selected element with the new component
                  selectedElement.replaceWith(element);
                }
              }}
            />
          </div>
        )}
        
        {/* Selection overlay rendered inside shadow root */}
        {shadowRootRef.current && selectedElement && (
          <SelectionOverlay selectedElement={selectedElement} shadowRoot={shadowRootRef.current} />
        )}
      </ShadowRoot.div>
    </div>
  );
}
