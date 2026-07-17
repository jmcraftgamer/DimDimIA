'use client'

import { CATEGORIES } from '../types'

interface CategoryNavProps {
  active: string
  onSelect: (slug: string) => void
}

export default function CategoryNav({ active, onSelect }: CategoryNavProps) {
  return (
    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect('')}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
          active === ''
            ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
            : 'bg-white text-gray-600 border-[#e5e5e5] hover:bg-[#f5f5f5]'
        }`}
      >
        Todos
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
            active === cat.slug
              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
              : 'bg-white text-gray-600 border-[#e5e5e5] hover:bg-[#f5f5f5]'
          }`}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  )
}
