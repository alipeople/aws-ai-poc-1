'use client';

import { useState, useCallback } from 'react';
import type { StreamEvent } from '@/types/api';

export interface SSECallbacks {
  onChunk: (event: StreamEvent) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface UseSSEReturn {
  streamSSE: (url: string, body: object, callbacks: SSECallbacks) => Promise<AbortController>;
  isStreaming: boolean;
  error: Error | null;
}

/**
 * Custom hook for consuming SSE streams via fetch + ReadableStream.
 * Uses POST requests (EventSource only supports GET).
 */
export function useSSE(): UseSSEReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const streamSSE = useCallback(
    async (url: string, body: object, callbacks: SSECallbacks): Promise<AbortController> => {
      const controller = new AbortController();
      setIsStreaming(true);
      setError(null);

      (async () => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'text/event-stream',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          if (!response.body) {
            throw new Error('Response body is null');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep the last (potentially incomplete) line in the buffer
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const raw = line.slice(6).trim();
                if (!raw || raw === '[DONE]') continue;
                try {
                  const event = JSON.parse(raw) as StreamEvent;
                  callbacks.onChunk(event);
                } catch {
                  // Skip malformed JSON chunks
                }
              }
            }
          }

          callbacks.onComplete?.();
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            // Cancelled by user — not an error
            return;
          }
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          callbacks.onError?.(error);
        } finally {
          setIsStreaming(false);
        }
      })();

      return controller;
    },
    []
  );

  return { streamSSE, isStreaming, error };
}
