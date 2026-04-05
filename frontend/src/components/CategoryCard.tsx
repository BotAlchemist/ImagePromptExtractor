import { useState } from 'react';
import { CATEGORY_META } from '../config/categories';
import type { Categories } from '../types';

type CategoryValue = string | string[];

interface Props {
  categoryKey: keyof Categories;
  value: CategoryValue;
  onChange: (key: keyof Categories, value: CategoryValue) => void;
}

export function CategoryCard({ categoryKey, value, onChange }: Props) {
  const meta = CATEGORY_META[categoryKey];
  const [editing, setEditing] = useState(false);

  const isEmpty = Array.isArray(value) ? value.length === 0 : !value;

  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value;
    if (meta.isArray) {
      onChange(
        categoryKey,
        raw
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      );
    } else {
      onChange(categoryKey, raw);
    }
    setEditing(false);
  };

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-2 bg-white transition-shadow hover:shadow-md ${
        isEmpty ? 'border-gray-200 opacity-60' : 'border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            {meta.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{meta.description}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
          title="Edit"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
          </svg>
        </button>
      </div>

      {editing ? (
        meta.isArray ? (
          <input
            autoFocus
            defaultValue={displayValue}
            onBlur={handleBlur}
            placeholder="Comma-separated values"
            className="text-sm border border-blue-400 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        ) : (
          <textarea
            autoFocus
            defaultValue={displayValue}
            onBlur={handleBlur}
            rows={2}
            className="text-sm border border-blue-400 rounded-md px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        )
      ) : (
        <p
          className={`text-sm text-gray-700 leading-relaxed cursor-text min-h-[1.5rem] ${
            isEmpty ? 'italic text-gray-400' : ''
          }`}
          onClick={() => setEditing(true)}
        >
          {isEmpty ? 'Not found in prompt' : displayValue}
        </p>
      )}
    </div>
  );
}
