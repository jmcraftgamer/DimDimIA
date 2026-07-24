'use client'

import { useRef } from 'react'
import ProductCard from './ProductCard'

interface ProductCarouselProps {
  title: string
  products: any[]
  loading?: boolean
}

export default function ProductCarousel({ title, products, loading }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.6
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#1a1a1a]">{title}</h3>
      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-1"
          aria-label="Anterior"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-1"
          aria-label="Próximo"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[160px] sm:min-w-[180px] bg-[#f8f8f8] rounded-xl animate-pulse shrink-0">
                <div className="aspect-square" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-[#e5e5e5] rounded w-3/4" />
                  <div className="h-4 bg-[#e5e5e5] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? null : (
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          >
            {products.map((product: any) => (
              <div key={product.id || product.name + product.store} className="min-w-[160px] sm:min-w-[180px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
