'use client';

import { useState, useRef } from 'react';

export interface ImageUploaderProps {
  organizationId: string;
  onUploadComplete?: (asset: { id: string; url: string; jobId?: string }) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
}

/**
 * ImageUploader - Handles image upload and triggers async description
 * In production, this would use presigned URLs for direct S3/R2 upload
 */
export function ImageUploader({
  organizationId,
  onUploadComplete,
  onUploadError,
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError?.(new Error('Please select an image file'));
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // In production, this would:
      // 1. Get presigned URL from server
      // 2. Upload directly to S3/R2
      // 3. Register asset in database
      // For now, we'll use a simple FormData upload

      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);

      const response = await fetch('/api/ai-editor/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setProgress(100);

      onUploadComplete?.({
        id: result.asset.id,
        url: result.asset.url,
        jobId: result.jobId,
      });
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="image-upload-input"
      />
      <label
        htmlFor="image-upload-input"
        className={`
          inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
          cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          ${uploading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {uploading ? (
          <>
            <span className="mr-2">Uploading... {progress}%</span>
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
          </>
        ) : (
          '📷 Upload Image'
        )}
      </label>
    </div>
  );
}

