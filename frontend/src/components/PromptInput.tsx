import { useState, useEffect } from 'react';

interface Props {
  onExtract: (prompt: string) => void;
  loading: boolean;
  initialValue?: string;
}

export function PromptInput({ onExtract, loading, initialValue = '' }: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && value.trim() && !loading) {
      onExtract(value.trim());
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700">
        Paste your image generation prompt
        <span className="ml-1 text-xs font-normal text-gray-400">(Ctrl+Enter to extract)</span>
      </label>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. photorealistic portrait of an astronaut on Mars, golden hour lighting, shot on 85mm f/1.8, shallow depth of field, by Greg Rutkowski, 4K, artstation..."
        rows={6}
        disabled={loading}
        className="w-full p-4 border border-gray-300 rounded-xl resize-y font-mono text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 transition"
      />
      <div className="flex justify-end">
        <button
          onClick={() => onExtract(value.trim())}
          disabled={!value.trim() || loading}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Extracting…
            </span>
          ) : (
            'Extract'
          )}
        </button>
      </div>
    </div>
  );
}
