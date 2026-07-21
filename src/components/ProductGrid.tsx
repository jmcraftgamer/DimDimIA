'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProductCard from './ProductCard'
import CategoryNav from './CategoryNav'

const PAGE_SIZE = 20

interface ProductGridProps {
  initialCategory?: string
}

export default function ProductGrid({ initialCategory = '' }: ProductGridProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [category, setCategory] = useState(initialCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchProducts = useCallback(async (cat: string, off: number, append: boolean) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const params = new URLSearchParams()
      if (cat) params.set('category', cat)
      params.set('offset', off.toString())
      params.set('limit', PAGE_SIZE.toString())
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
  }, [])

  useEffect(() => {
    setProducts([])
    setOffset(0)
    setHasMore(true)
    setInitialLoaded(false)
    fetchProducts(category, 0, false)
  }, [category, fetchProducts])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts(category, 0, false)
    }, 15000)
    return () => clearInterval(interval)
  }, [category, fetchProducts])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchProducts(category, offset, true)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, offset, category, fetchProducts])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setProducts([])
    setHasMore(false)
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}&offset=0&limit=${PAGE_SIZE}`)
      const data = await res.json()
      setProducts(data.products || [])
      setTotal(data.total || 0)
      setHasMore((PAGE_SIZE) < (data.total || 0))
      setOffset(PAGE_SIZE)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    searchInputRef.current?.focus()
    setCategory('')
    setProducts([])
    setOffset(0)
    setHasMore(true)
    setInitialLoaded(false)
    fetchProducts('', 0, false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar produtos em todas as lojas..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] bg-white text-sm outline-none focus:border-[#1a1a1a] transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Buscar
        </button>
      </div>

      <CategoryNav active={category} onSelect={setCategory} />

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {initialLoaded && !loading
            ? `${total} produtos encontrados`
            : ''}
        </div>
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="text-xs text-[#1a1a1a] underline hover:no-underline"
          >
            Limpar busca
          </button>
        )}
      </div>

      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
