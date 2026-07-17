'use client'

import ProductGrid from '../../components/ProductGrid'

export default function StorePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black gradient-text">
          Nossa Loja
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          As melhores promoções selecionadas pela nossa IA em todas as lojas
        </p>
      </div>

      <ProductGrid />
    </div>
  )
}
