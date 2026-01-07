'use client';

import { useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { transform } from 'sucrase';

export interface LivePreviewProps {
  code: string;
  context?: Record<string, unknown>;
  componentId: string;
  onUpdate?: (element: HTMLElement | null) => void;
}

/**
 * LivePreview - Transpiles and renders React component code client-side
 * Uses sucrase for fast client-side transpilation
 * Ensures ProductList and other components use real Commerce data from context
 */
export function LivePreview({ code, context, componentId, onUpdate }: LivePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranspiling, setIsTranspiling] = useState(false);

  useEffect(() => {
    if (!code.trim() || !containerRef.current) return;

    setIsTranspiling(true);
    setError(null);

    try {
      // Clean the code - remove markdown code blocks if present
      let cleanCode = code.trim();
      if (cleanCode.startsWith('```')) {
        cleanCode = cleanCode.replace(/^```(?:jsx?|tsx?)?\n/, '').replace(/\n```$/, '');
      }

      // Transpile JSX/TSX to JavaScript using sucrase
      const transformed = transform(cleanCode, {
        transforms: ['jsx', 'typescript', 'imports'],
        jsxPragma: 'React.createElement',
        jsxFragmentPragma: 'React.Fragment',
      });

      // Extract context data
      const contextData = context || {};
      const products = (contextData.products as Array<unknown>) || [];

      // Create a safe execution environment
      // We'll create a component factory that uses the context
      const createComponent = new Function(
        'React',
        'ReactDOM',
        'products',
        'context',
        `
        ${transformed.code}
        
        // Try to find exported component
        if (typeof exports !== 'undefined' && exports.default) {
          return exports.default;
        }
        if (typeof module !== 'undefined' && module.exports && module.exports.default) {
          return module.exports.default;
        }
        
        // Try to find ProductList or other common component names
        if (typeof ProductList !== 'undefined') {
          return function(props) {
            return React.createElement(ProductList, { products: products, ...props });
          };
        }
        
        // Try to find any component-like function
        const componentNames = ['Component', 'DefaultComponent', 'App', 'Main'];
        for (const name of componentNames) {
          if (typeof window[name] !== 'undefined') {
            return window[name];
          }
          if (typeof eval(name) !== 'undefined') {
            return eval(name);
          }
        }
        
        // Fallback: create a simple component that uses products
        return function(props) {
          if (products && products.length > 0) {
            return React.createElement('div', { 
              'data-component-id': '${componentId}',
              className: 'product-list'
            },
              products.map(function(product, idx) {
                return React.createElement('div', { 
                  key: product.id || idx,
                  className: 'product-item'
                },
                  React.createElement('h3', null, product.name || 'Product'),
                  product.description && React.createElement('p', null, product.description),
                  product.price && React.createElement('span', null, '$' + product.price)
                );
              })
            );
          }
          return React.createElement('div', { 
            'data-component-id': '${componentId}',
            className: 'generated-component'
          }, 'Generated Component');
        };
        `
      );

      // Execute and get the component
      const Component = createComponent(
        React,
        (window as any).ReactDOM,
        products,
        contextData
      );

      // Render the component
      const root = containerRef.current;
      if (root && Component) {
        // Clear previous content
        root.innerHTML = '';

        // Use React 18 createRoot if available
        if ((window as any).ReactDOM?.createRoot) {
          const reactRoot = (window as any).ReactDOM.createRoot(root);
          reactRoot.render(React.createElement(Component, { products, ...contextData }));
        } else if ((window as any).ReactDOM?.render) {
          // Fallback for React 17
          (window as any).ReactDOM.render(
            React.createElement(Component, { products, ...contextData }),
            root
          );
        } else {
          // Last resort: render manually
          const element = React.createElement(Component, { products, ...contextData });
          if (element && root) {
            // This is a simplified render - in production, you'd use ReactDOM
            root.innerHTML = '<div>React rendering not available</div>';
          }
        }

        if (onUpdate && root) {
          onUpdate(root);
        }
      }
    } catch (err) {
      console.error('LivePreview error:', err);
      setError(err instanceof Error ? err.message : 'Transpilation failed');
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div class="error text-red-600 text-sm p-2">Error: ${err instanceof Error ? err.message : 'Unknown error'}</div>`;
      }
    } finally {
      setIsTranspiling(false);
    }
  }, [code, context, componentId, onUpdate]);

  if (error) {
    return (
      <div ref={containerRef} className="live-preview-error">
        <div className="text-red-600 text-sm p-2">Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="live-preview-container"
      data-component-id={componentId}
      style={{ minHeight: '50px' }}
    >
      {isTranspiling && (
        <div className="text-gray-500 text-sm p-2">Transpiling and rendering...</div>
      )}
    </div>
  );
}
