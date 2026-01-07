'use client';

import { useEffect, useState } from 'react';
import type { JobStatusResponse } from '../lib/job-types';

export interface JobStatusPollingProps {
  jobId: string;
  onComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
  pollInterval?: number; // milliseconds, default 2000
  maxAttempts?: number; // default 150 (5 minutes at 2s intervals)
}

/**
 * JobStatusPolling - Polls job status and calls callbacks on completion/error
 * Uses exponential backoff for polling intervals
 */
export function JobStatusPolling({
  jobId,
  onComplete,
  onError,
  pollInterval = 2000,
  maxAttempts = 150,
}: JobStatusPollingProps) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!jobId) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    let currentInterval = pollInterval;

    const poll = async () => {
      try {
        const response = await fetch(`/api/ai-editor/jobs/${jobId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Job not found - might have been cleaned up
            console.warn(`Job ${jobId} not found`);
            return;
          }
          throw new Error(`Failed to fetch job status: ${response.statusText}`);
        }

        const jobStatus: JobStatusResponse = await response.json();
        setStatus(jobStatus);
        setAttempts((prev) => prev + 1);

        // Handle completed job
        if (jobStatus.status === 'completed') {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          onComplete?.(jobStatus.result);
          return;
        }

        // Handle failed job
        if (jobStatus.status === 'failed') {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          onError?.(jobStatus.error || 'Job failed');
          return;
        }

        // Exponential backoff: increase interval after initial attempts
        if (attempts > 5 && currentInterval < 10000) {
          currentInterval = Math.min(currentInterval * 1.5, 10000);
          clearInterval(intervalId);
          intervalId = setInterval(poll, currentInterval);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        // Continue polling on error
      }
    };

    // Start polling immediately
    poll();

    // Set up interval polling
    intervalId = setInterval(poll, currentInterval);

    // Set up max attempts timeout
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      onError?.('Job status polling timeout');
    }, maxAttempts * pollInterval);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [jobId, pollInterval, maxAttempts, attempts, onComplete, onError]);

  if (!status) {
    return (
      <div className="text-sm text-gray-500">
        Checking job status...
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">Job Status:</span>
        <span className={`px-2 py-1 rounded text-xs ${
          status.status === 'completed' ? 'bg-green-100 text-green-800' :
          status.status === 'failed' ? 'bg-red-100 text-red-800' :
          status.status === 'active' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status.status}
        </span>
        {status.progress !== undefined && (
          <span className="text-gray-600">{status.progress}%</span>
        )}
      </div>
      {status.error && (
        <div className="mt-2 text-red-600 text-xs">{status.error}</div>
      )}
    </div>
  );
}

