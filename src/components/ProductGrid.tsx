'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProductCarousel from './ProductCarousel'
import CategoryNav from './CategoryNav'
import { CATEGORIES, SUBCATEGORIES } from '../types'

const CAROUSEL_LIMIT = 12

interface ProductGridProps {
  initialCategory?: string
}

export default function ProductGrid({ initialCategory = '' }: ProductGridProps) {
  const [carousels, setCarousels] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [category, setCategory] = useState(initialCategory)
  const [subcategory, setSubcategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [initialLoaded, setInitialLoaded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>(undefined)

  const fetchCarousel = useCallback(async (key: string, cat: string, q: string) => {
    setLoading(prev => ({ ...prev, [key]: true }))
    try {
      const params = new URLSearchParams()
      if (cat) params.set('category', cat)
      if (q) params.set('q', q)
      params.set('offset', '0')
      params.set('limit', CAROUSEL_LIMIT.toString())
      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      setCarousels(prev => ({ ...prev, [key]: data.products || [] }))
    } catch {
      setCarousels(prev => ({ ...prev, [key]: [] }))
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
      setInitialLoaded(true)
    }
  }, [])

  const loadAllCarousels = useCallback(() => {
    const keys: { key: string; cat: string; q: string }[] = []

    if (category && subcategory) {
      keys.push({ key: `${category}-${subcategory}`, cat: category, q: subcategory })
    } else if (category) {
      const subs = SUBCATEGORIES[category] || []
      if (subs.length > 0) {
        subs.forEach(sub => {
          keys.push({ key: `${category}-${sub.keyword}`, cat: category, q: sub.keyword })
        })
      } else {
        keys.push({ key: category, cat: category, q: '' })
      }
    } else if (searchQuery) {
      keys.push({ key: 'busca', cat: '', q: searchQuery })
    } else {
      CATEGORIES.forEach(cat => {
        keys.push({ key: cat.slug, cat: cat.slug, q: '' })
      })
    }

    keys.forEach(({ key, cat, q }) => {
      if (!carousels[key]) fetchCarousel(key, cat, q)
    })
  }, [category, subcategory, searchQuery, fetchCarousel, carousels])

  useEffect(() => {
    setCarousels({})
    setInitialLoaded(false)
    loadAllCarousels()
  }, [category, subcategory, searchQuery])

  useEffect(() => {
    const interval = setInterval(() => {
      loadAllCarousels()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadAllCarousels])

  useEffect(() => {
    fetch('/api/cron').catch(() => {})
  }, [])

  const handleSearchInput = (val: string) => {
    setSearchQuery(val)
    setCategory('')
    setSubcategory('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setCarousels({})
      loadAllCarousels()
    }, 300)
  }

  const handleCategorySelect = (slug: string) => {
    setCategory(slug)
    setSubcategory('')
    setSearchQuery('')
    setCarousels({})
  }

  const handleSubcategorySelect = (keyword: string) => {
    setSubcategory(keyword)
    setSearchQuery('')
    setCarousels({})
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSubcategory('')
    setCategory('')
    setCarousels({})
    searchInputRef.current?.focus()
  }

  const renderCarousels = () => {
    if (searchQuery) {
      const key = 'busca'
      return (
        <ProductCarousel
          title={`Resultados para "${searchQuery}"`}
          products={carousels[key] || []}
          loading={loading[key]}
        />
      )
    }

    if (category && subcategory) {
      const key = `${category}-${subcategory}`
      return (
        <ProductCarousel
          title={subcategory}
          products={carousels[key] || []}
          loading={loading[key]}
        />
      )
    }

    if (category) {
      const subs = SUBCATEGORIES[category] || []
      if (subs.length > 0) {
        return subs.map(sub => {
          const key = `${category}-${sub.keyword}`
          return (
            <ProductCarousel
              key={key}
              title={sub.name}
              products={carousels[key] || []}
              loading={loading[key]}
            />
          )
        })
      }
      return (
        <ProductCarousel
          title={CATEGORIES.find(c => c.slug === category)?.name || category}
          products={carousels[category] || []}
          loading={loading[category]}
        />
      )
    }

    return CATEGORIES.map(cat => (
      <ProductCarousel
        key={cat.slug}
        title={cat.name}
        products={carousels[cat.slug] || []}
        loading={loading[cat.slug]}
      />
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white text-sm outline-none focus:border-[#1a1a1a] transition-colors"
          />
        </div>
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      <CategoryNav
        active={category}
        onSelect={handleCategorySelect}
        onSubcategory={handleSubcategorySelect}
        activeSubcategory={subcategory}
      />

      {initialLoaded && Object.keys(carousels).length === 0 && !Object.values(loading).some(Boolean) ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Nenhum produto encontrado.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Recarregar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {renderCarousels()}
        </div>
      )}
    </div>
  )
}
