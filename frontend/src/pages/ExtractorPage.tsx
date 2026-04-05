import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PromptInput } from '../components/PromptInput';
import { CategoryGrid } from '../components/CategoryGrid';
import { SavePromptModal } from '../components/SavePromptModal';
import { useExtract } from '../hooks/useExtract';
import { useLibrary } from '../hooks/useLibrary';
import type { Categories } from '../types';

interface LocationState {
  prompt?: string;
}

export function ExtractorPage() {
  const location = useLocation();
  const initialPrompt = (location.state as LocationState)?.prompt ?? '';

  const { categories, loading, error, extract } = useExtract();
  const { save } = useLibrary();

  const [rawPrompt, setRawPrompt] = useState(initialPrompt);
  const [editedCategories, setEditedCategories] = useState<Categories | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync edited categories whenever fresh extraction arrives
  useEffect(() => {
    if (categories) setEditedCategories({ ...categories });
  }, [categories]);

  const handleExtract = (prompt: string) => {
    setRawPrompt(prompt);
    extract(prompt);
  };

  const handleCategoryChange = (key: keyof Categories, value: string | string[]) => {
    setEditedCategories(prev => (prev ? { ...prev, [key]: value } : null));
  };

  const handleSave = async (title: string, tags: string[], notes: string) => {
    if (!editedCategories) return;
    await save({ rawPrompt, title, categories: editedCategories, tags, notes });
    setShowModal(false);
    showToast('Saved to library!');
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Prompt Extractor</h1>
        <p className="text-sm text-gray-500">
          Paste an image generation prompt to break it down into structured categories.
        </p>
      </div>

      <PromptInput onExtract={handleExtract} loading={loading} initialValue={initialPrompt} />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {editedCategories && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Extracted Categories</h2>
            <p className="text-xs text-gray-400">Click any field to edit it</p>
          </div>

          <CategoryGrid categories={editedCategories} onChange={handleCategoryChange} />

          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Save to Library
            </button>
          </div>
        </div>
      )}

      <SavePromptModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
