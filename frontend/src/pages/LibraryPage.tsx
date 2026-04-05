import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PromptCard } from '../components/PromptCard';
import { FilterBar } from '../components/FilterBar';
import { useLibrary } from '../hooks/useLibrary';
import type { SavedPrompt } from '../types';

interface Filters {
  search: string;
  category: string;
  tag: string;
}

export function LibraryPage() {
  const navigate = useNavigate();
  const { prompts, loading, error, nextCursor, load, remove } = useLibrary();

  const [filters, setFilters] = useState<Filters>({ search: '', category: '', tag: '' });

  useEffect(() => {
    load({ replace: true });
  }, [load]);

  // Derive unique tags from loaded prompts for the tag filter dropdown
  const allTags = useMemo(() => {
    const set = new Set<string>();
    prompts.forEach(p => p.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [prompts]);

  // Client-side filtering over the loaded prompts
  const filtered = useMemo(() => {
    return prompts.filter((p: SavedPrompt) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inTags = p.tags.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inTags) return false;
      }
      if (filters.category) {
        const val = p.categories[filters.category as keyof typeof p.categories];
        const hasVal = Array.isArray(val) ? val.length > 0 : Boolean(val);
        if (!hasVal) return false;
      }
      if (filters.tag) {
        if (!p.tags.includes(filters.tag)) return false;
      }
      return true;
    });
  }, [prompts, filters]);

  const handleUse = (rawPrompt: string) => {
    navigate('/', { state: { prompt: rawPrompt } });
  };

  const handleLoadMore = () => {
    if (nextCursor) load({ cursor: nextCursor });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Prompt Library</h1>
        <p className="text-sm text-gray-500">
          Browse and reuse your saved image generation prompts.
        </p>
      </div>

      <FilterBar filters={filters} allTags={allTags} onChange={setFilters} />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && prompts.length === 0 ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <p className="text-gray-400 text-sm">
            {prompts.length === 0 ? 'No saved prompts yet.' : 'No prompts match the current filters.'}
          </p>
          {prompts.length === 0 && (
            <button
              onClick={() => navigate('/')}
              className="text-sm text-blue-600 hover:underline"
            >
              Extract your first prompt →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-400">
            Showing {filtered.length} of {prompts.length} loaded prompts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => (
              <PromptCard key={p.promptId} prompt={p} onDelete={remove} onUse={handleUse} />
            ))}
          </div>

          {nextCursor && !filters.search && !filters.category && !filters.tag && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
