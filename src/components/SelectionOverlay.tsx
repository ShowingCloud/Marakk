'use client';

import { useEffect, useRef } from 'react';

interface SelectionOverlayProps {
  selectedElement: HTMLElement | null;
  shadowRoot: ShadowRoot | null;
}

/**
 * SelectionOverlay - Draws a blue border box over the selected element
 * This component renders inside the Shadow DOM to provide visual feedback
 */
export function SelectionOverlay({ selectedElement, shadowRoot }: SelectionOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedElement || !shadowRoot || !overlayRef.current) {
      return;
    }

    const overlay = overlayRef.current;
    const updatePosition = () => {
      const rect = selectedElement.getBoundingClientRect();
      const shadowHost = shadowRoot.host;
      const hostRect = shadowHost.getBoundingClientRect();

      // Calculate position relative to shadow host
      const top = rect.top - hostRect.top + shadowHost.scrollTop;
      const left = rect.left - hostRect.left + shadowHost.scrollLeft;

      overlay.style.position = 'absolute';
      overlay.style.top = `${top}px`;
      overlay.style.left = `${left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.border = '2px solid #3b82f6'; // Blue border
      overlay.style.borderRadius = '4px';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9999';
      overlay.style.boxSizing = 'border-box';
      overlay.style.transition = 'all 0.1s ease';
      overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; // Light blue background
    };

    updatePosition();

    // Update on scroll/resize
    const handleUpdate = () => updatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [selectedElement, shadowRoot]);

  if (!selectedElement) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

