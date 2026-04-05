import { useState, useCallback } from 'react';
import { apiRequest } from '../lib/apiClient';
import type { SavedPrompt, ListResponse, Categories } from '../types';

interface SavePayload {
  rawPrompt: string;
  title: string;
  categories: Categories;
  tags: string[];
  notes: string;
}

export function useLibrary() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { cursor?: string; replace?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: '20' });
      if (opts?.cursor) qs.set('cursor', opts.cursor);

      const result = await apiRequest<ListResponse>(`/prompts?${qs.toString()}`);

      setPrompts(prev =>
        opts?.cursor && !opts?.replace ? [...prev, ...result.items] : result.items,
      );
      setNextCursor(result.nextCursor);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = async (payload: SavePayload): Promise<SavedPrompt> => {
    const created = await apiRequest<SavedPrompt>('/prompts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setPrompts(prev => [created, ...prev]);
    return created;
  };

  const remove = async (promptId: string) => {
    await apiRequest(`/prompts/${encodeURIComponent(promptId)}`, { method: 'DELETE' });
    setPrompts(prev => prev.filter(p => p.promptId !== promptId));
  };

  return { prompts, loading, error, nextCursor, load, save, remove };
}
