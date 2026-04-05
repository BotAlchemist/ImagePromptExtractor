import { CATEGORY_ORDER, CATEGORY_META } from '../config/categories';

interface Filters {
  search: string;
  category: string;
  tag: string;
}

interface Props {
  filters: Filters;
  allTags: string[];
  onChange: (filters: Filters) => void;
}

export function FilterBar({ filters, allTags, onChange }: Props) {
  const update = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  return (
    <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
      {/* Keyword search */}
      <div className="flex-1 min-w-[180px]">
        <input
          value={filters.search}
          onChange={e => update({ search: e.target.value })}
          placeholder="Search by title or tag…"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category filter */}
      <select
        value={filters.category}
        onChange={e => update({ category: e.target.value })}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
      >
        <option value="">All categories</option>
        {CATEGORY_ORDER.map(key => (
          <option key={key} value={key}>
            {CATEGORY_META[key].label}
          </option>
        ))}
      </select>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <select
          value={filters.tag}
          onChange={e => update({ tag: e.target.value })}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        >
          <option value="">All tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      )}

      {/* Clear filters */}
      {(filters.search || filters.category || filters.tag) && (
        <button
          onClick={() => onChange({ search: '', category: '', tag: '' })}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors whitespace-nowrap"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
