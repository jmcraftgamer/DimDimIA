'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProductCard from './ProductCard'
import CategoryNav from './CategoryNav'

const PAGE_SIZE = 500

interface ProductGridProps {
  initialCategory?: string
}

export default function ProductGrid({ initialCategory = '' }: ProductGridProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [category, setCategory] = useState(initialCategory)
  const [subcategory, setSubcategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>(undefined)

  const buildParams = useCallback((cat: string, sub: string, sq: string, off: number) => {
    const params = new URLSearchParams()
    if (cat) params.set('category', cat)
    if (sq) params.set('q', sq)
    params.set('offset', off.toString())
    params.set('limit', PAGE_SIZE.toString())
    return params
  }, [])

  const fetchProducts = useCallback(async (cat: string, sub: string, sq: string, off: number, append: boolean) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const params = buildParams(cat, sub, sq, off)
      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      if (append) {
        setProducts(prev => [...prev, ...(data.products || [])])
      } else {
        setProducts(data.products || [])
      }
      setTotal(data.total || 0)
      setHasMore((off + PAGE_SIZE) < (data.total || 0))
      setOffset(off + PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setInitialLoaded(true)
    }
  }, [buildParams])

  const triggerSearch = useCallback((cat: string, sub: string, sq: string) => {
    setProducts([])
    setOffset(0)
    setHasMore(true)
    setInitialLoaded(false)
    fetchProducts(cat, sub, sq, 0, false)
  }, [fetchProducts])

  useEffect(() => {
    triggerSearch(category, subcategory, searchQuery)
  }, [category, subcategory, triggerSearch])

  const handleSearchInput = (val: string) => {
    setSearchQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      triggerSearch(category, subcategory, val)
    }, 300)
  }

  const handleSubcategory = (keyword: string) => {
    setSubcategory(keyword)
    if (keyword) {
      setSearchQuery(keyword)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts(category, subcategory, searchQuery, 0, false)
    }, 15000)
    return () => clearInterval(interval)
  }, [category, subcategory, searchQuery, fetchProducts])

  useEffect(() => {
    fetch('/api/cron').catch(() => {})
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchProducts(category, subcategory, searchQuery, offset, true)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, offset, category, subcategory, searchQuery, fetchProducts])

  const clearSearch = () => {
    setSearchQuery('')
    setSubcategory('')
    searchInputRef.current?.focus()
    setCategory('')
    triggerSearch('', '', '')
  }

  return (
    <div className="space-y-4">
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
        onSelect={(s) => { setCategory(s); setSubcategory('') }}
        onSubcategory={handleSubcategory}
        activeSubcategory={subcategory}
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {initialLoaded && !loading
            ? `${total} produtos encontrados`
            : ''}
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-[#f8f8f8] rounded-xl animate-pulse">
              <div className="aspect-square" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-[#e5e5e5] rounded w-3/4" />
                <div className="h-4 bg-[#e5e5e5] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 && initialLoaded ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            Nenhum produto encontrado.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Recarregar
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product: any) => (
              <ProductCard key={product.id || product.name + product.store} product={product} />
            ))}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={sentinelRef} className="h-4" />
        </>
      )}
    </div>
  )
}
