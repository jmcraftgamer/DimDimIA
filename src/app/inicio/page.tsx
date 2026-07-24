'use client'

import { useState, useEffect } from 'react'
import ChatBox from '../../components/ChatBox'
import ProductCard from '../../components/ProductCard'

export default function InicioPage() {
  const [featured, setFeatured] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/products?limit=20')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setFeatured(data.products)
      })
      .catch(() => {})
  }, [])

  return (
    <div>
      <ChatBox embedded />

      <section className="max-w-6xl mx-auto px-4 py-12 border-t border-[#e5e5e5] mt-8">
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">
          Melhores Promoções em Destaque
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Os maiores descontos do momento selecionados para você
        </p>

        {featured.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featured.map((product: any) => (
              <ProductCard key={product.id || product.name + product.store} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
