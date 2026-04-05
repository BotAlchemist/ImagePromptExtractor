import { CategoryCard } from './CategoryCard';
import { CATEGORY_ORDER } from '../config/categories';
import type { Categories } from '../types';

interface Props {
  categories: Categories;
  onChange: (key: keyof Categories, value: string | string[]) => void;
}

export function CategoryGrid({ categories, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CATEGORY_ORDER.map(key => (
        <CategoryCard
          key={key}
          categoryKey={key}
          value={categories[key]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
