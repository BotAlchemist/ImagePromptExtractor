import { useState } from 'react';
import { CATEGORY_META, CATEGORY_ORDER } from '../config/categories';
import type { SavedPrompt } from '../types';

interface Props {
  prompt: SavedPrompt;
  onDelete: (promptId: string) => void;
  onUse: (rawPrompt: string) => void;
}

export function PromptCard({ prompt, onDelete, onUse }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = new Date(prompt.savedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{prompt.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Raw prompt preview */}
      <p className="text-sm text-gray-600 line-clamp-2 font-mono leading-relaxed">
        {prompt.rawPrompt}
      </p>

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prompt.tags.map(tag => (
            <span
              key={tag}
              className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expanded categories */}
      {expanded && (
        <div className="border-t border-gray-100 pt-4 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORY_ORDER.map(key => {
              const val = prompt.categories[key];
              const isEmpty = Array.isArray(val) ? val.length === 0 : !val;
              if (isEmpty) return null;
              return (
                <div key={key}>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    {CATEGORY_META[key].label}
                  </p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    {Array.isArray(val) ? val.join(', ') : val}
                  </p>
                </div>
              );
            })}
          </div>
          {prompt.notes && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</p>
              <p className="text-sm text-gray-600 mt-0.5">{prompt.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onUse(prompt.rawPrompt)}
          className="flex-1 text-sm font-medium py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Use Prompt
        </button>
        {confirmDelete ? (
          <>
            <button
              onClick={() => onDelete(prompt.promptId)}
              className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
