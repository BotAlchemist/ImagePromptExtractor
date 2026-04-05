import { useState } from 'react';
import { apiRequest } from '../lib/apiClient';
import type { Categories } from '../types';

interface ExtractState {
  categories: Categories | null;
  loading: boolean;
  error: string | null;
}

export function useExtract() {
  const [state, setState] = useState<ExtractState>({
    categories: null,
    loading: false,
    error: null,
  });

  const extract = async (prompt: string) => {
    setState({ categories: null, loading: true, error: null });
    try {
      const result = await apiRequest<Categories>('/extract', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      setState({ categories: result, loading: false, error: null });
    } catch (err) {
      setState({ categories: null, loading: false, error: (err as Error).message });
    }
  };

  const reset = () => setState({ categories: null, loading: false, error: null });

  return { ...state, extract, reset };
}
