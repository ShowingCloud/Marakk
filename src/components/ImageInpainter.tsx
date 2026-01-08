'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { JobStatusPolling } from './JobStatusPolling';

export interface ImageInpainterProps {
  imageUrl: string;
  imageId: string;
  organizationId: string;
  onInpaintComplete?: (resultUrl: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

interface MaskPoint {
  x: number;
  y: number;
}

/**
 * ImageInpainter - Canvas-based image masking and inpainting
 * 
 * Features:
 * - Canvas overlay for mask painting
 * - Mask coordinate capture
 * - Async job submission for diffusion model
 * - Placeholder rendering during processing
 */
export function ImageInpainter({
  imageUrl,
  imageId,
  organizationId,
  onInpaintComplete,
  onError,
  className = '',
}: ImageInpainterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskData, setMaskData] = useState<ImageData | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [maskPoints, setMaskPoints] = useState<MaskPoint[]>([]);

  // Load image and initialize canvas
  useEffect(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        
        // Set canvas size to match image
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / image.width);
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        
        // Set container size
        container.style.width = `${canvas.width}px`;
        container.style.height = `${canvas.height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw image
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          
          // Initialize mask layer (transparent)
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    };
    image.src = imageUrl;
    imageRef.current = image;
  }, [imageUrl]);

  // Get mouse/touch position relative to canvas
  const getCanvasPosition = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): MaskPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Draw on canvas (mask painting)
  const draw = useCallback((point: MaskPoint) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw mask (white for masked areas)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // White with transparency
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Add point to mask points array
    setMaskPoints((prev) => [...prev, point]);
  }, [brushSize]);

  // Handle mouse/touch start
  const handleStart = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCanvasPosition(e);
    if (point) {
      setIsDrawing(true);
      draw(point);
    }
  }, [getCanvasPosition, draw]);

  // Handle mouse/touch move
  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const point = getCanvasPosition(e);
    if (point) {
      draw(point);
    }
  }, [isDrawing, getCanvasPosition, draw]);

  // Handle mouse/touch end
  const handleEnd = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Capture mask coordinates
  const captureMask = useCallback(async (): Promise<{ maskData: string; coordinates: MaskPoint[] }> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error('Canvas not initialized');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Get mask data (white pixels = masked areas)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Convert to base64 for transmission
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      maskCtx.putImageData(imageData, 0, 0);
      const maskDataUrl = maskCanvas.toDataURL('image/png');
      
      return {
        maskData: maskDataUrl,
        coordinates: maskPoints,
      };
    }

    throw new Error('Failed to capture mask');
  }, [maskPoints]);

  // Submit inpainting job
  const handleInpaint = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Capture mask
      const { maskData: maskDataUrl, coordinates } = await captureMask();
      
      // Submit job
      const response = await fetch('/api/ai-editor/inpaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          imageUrl,
          maskData: maskDataUrl,
          coordinates,
          organizationId,
          prompt: 'Fill the masked area naturally', // Can be made configurable
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit inpainting job');
      }

      const { jobId: newJobId } = await response.json();
      setJobId(newJobId);
    } catch (error) {
      console.error('Error submitting inpainting job:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
      setIsProcessing(false);
    }
  }, [imageId, imageUrl, organizationId, captureMask, onError]);

  // Clear mask
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw image
    const image = imageRef.current;
    if (image) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    setMaskPoints([]);
    setMaskData(null);
  }, []);

  // Handle job completion
  const handleJobComplete = useCallback((result: { status: string; resultUrl?: string }) => {
    if (result.status === 'completed' && result.resultUrl) {
      setIsProcessing(false);
      onInpaintComplete?.(result.resultUrl);
    } else if (result.status === 'failed') {
      setIsProcessing(false);
      onError?.(new Error('Inpainting job failed'));
    }
  }, [onInpaintComplete, onError]);

  return (
    <div className={`image-inpainter ${className}`}>
      <div className="inpainter-controls" style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label>
          Brush Size:
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            disabled={isProcessing}
          />
          <span style={{ marginLeft: '8px' }}>{brushSize}px</span>
        </label>
        <button
          onClick={handleClear}
          disabled={isProcessing}
          style={{
            padding: '8px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
          }}
        >
          Clear Mask
        </button>
        <button
          onClick={handleInpaint}
          disabled={isProcessing || maskPoints.length === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: isProcessing || maskPoints.length === 0 ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing || maskPoints.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {isProcessing ? 'Processing...' : 'Inpaint'}
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{
            display: 'block',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />
        
        {isProcessing && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
            }}
          >
            Processing inpainting...
          </div>
        )}
      </div>

      {jobId && (
        <div style={{ marginTop: '12px' }}>
          <JobStatusPolling
            jobId={jobId}
            onComplete={handleJobComplete}
            onError={onError}
          />
        </div>
      )}

      <style jsx>{`
        .image-inpainter {
          width: 100%;
        }
        .inpainter-controls label {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .inpainter-controls input[type='range'] {
          width: 100px;
        }
      `}</style>
    </div>
  );
}
