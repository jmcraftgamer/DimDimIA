'use client'

import { useState, useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import CategoryNav from './CategoryNav'

interface ProductGridProps {
  initialCategory?: string
}

export default function ProductGrid({ initialCategory = '' }: ProductGridProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(initialCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const syncRef = useRef(false)

  const fetchProducts = async (cat: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (cat) params.set('category', cat)
      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(category)
  }, [category])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts(category)
    }, 15000)
    return () => clearInterval(interval)
  }, [category])

  useEffect(() => {
    if (syncRef.current) return
    syncRef.current = true

    const triggerCron = async () => {
      setSyncing(true)
      let consecutiveEmpty = 0
      let totalBatches = 0

      while (consecutiveEmpty < 3 && totalBatches < 30) {
        try {
          const res = await fetch('/api/cron')
          const data = await res.json()

          totalBatches += data.batchesDone || 1

          if ((data.totalSaved || 0) === 0) {
            consecutiveEmpty++
          } else {
            consecutiveEmpty = 0
            setSyncStatus(`Buscando produtos... ${data.activeProducts || 0} encontrados`)
          }

          await new Promise((r) => setTimeout(r, 500))
        } catch {
          consecutiveEmpty++
        }
      }

      setSyncStatus('')
      setSyncing(false)
      fetchProducts(category)
    }

    triggerCron()
  }, [category])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
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

      {syncing && products.length === 0 && (
        <div className="text-center py-12 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5f5f5] rounded-full text-sm text-gray-600">
            <span className="w-2 h-2 bg-[#1a1a1a] rounded-full animate-pulse" />
            {syncStatus || 'Fazendo busca inicial...'}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400">
        {products.length > 0
          ? `${products.length} produtos em promoção`
          : ''}
      </div>

      {loading ? (
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
      ) : products.length === 0 && !syncing ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            Nenhum produto encontrado ainda.
          </p>
          <p className="text-gray-300 text-sm mt-2">
            O sistema está buscando as melhores promoções. Recarregue a página em alguns segundos.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Recarregar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product: any) => (
            <ProductCard key={product.id || product.name + product.store} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
