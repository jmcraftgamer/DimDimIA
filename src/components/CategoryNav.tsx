'use client'

import { CATEGORIES, SUBCATEGORIES } from '../types'
import { CATEGORY_ICONS } from './Icons'

interface CategoryNavProps {
  active: string
  onSelect: (slug: string) => void
  onSubcategory?: (keyword: string) => void
  activeSubcategory?: string
}

export default function CategoryNav({ active, onSelect, onSubcategory, activeSubcategory }: CategoryNavProps) {
  const subs = active ? SUBCATEGORIES[active] : undefined

  return (
    <div>
      <div className="flex overflow-x-auto gap-1.5 pb-2 scrollbar-hide">
        <button
          onClick={() => onSelect('')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            active === ''
              ? 'bg-[#1a1a1a] text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-[#f5f5f5]'
          }`}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.slug]
          return (
            <button
              key={cat.slug}
              onClick={() => onSelect(cat.slug)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                active === cat.slug
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-[#f5f5f5]'
              }`}
            >
              {Icon && <Icon size={16} />}
              {cat.name}
            </button>
          )
        })}
      </div>

      {subs && onSubcategory && (
        <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-hide ml-1">
          <button
            onClick={() => onSubcategory('')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              !activeSubcategory ? 'text-[#1a1a1a] bg-[#f0f0f0]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Todas
          </button>
          {subs.map((sub) => (
            <button
              key={sub.keyword}
              onClick={() => onSubcategory(sub.keyword)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeSubcategory === sub.keyword ? 'text-[#1a1a1a] bg-[#f0f0f0]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
