'use client'

import Image from 'next/image'

interface ProductCardProps {
  product: {
    id?: string
    name: string
    description?: string | null
    price: number
    oldPrice?: number | null
    coupon?: string | null
    couponCode?: string | null
    store: string
    imageUrl?: string | null
    productUrl: string
    rating?: number | null
    totalSales?: number | null
    freeShipping?: boolean | null
    category?: string | null
    score?: number | null
    reason?: string | null
  }
  variant?: 'full' | 'carousel'
}

const storeColors: Record<string, string> = {
  'Mercado Livre': 'bg-yellow-100 text-yellow-800',
  'Amazon': 'bg-orange-100 text-orange-800',
  'Shopee': 'bg-pink-100 text-pink-800',
  'AliExpress': 'bg-red-100 text-red-800',
  'Kabum': 'bg-blue-100 text-blue-800',
  'Pichau': 'bg-green-100 text-green-800',
  'TerabyteShop': 'bg-purple-100 text-purple-800',
}

export default function ProductCard({ product, variant = 'full' }: ProductCardProps) {
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null

  const isCarousel = variant === 'carousel'

  return (
    <a
      href={product.productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="product-card flex flex-col bg-white rounded-xl border border-[#e5e5e5] overflow-hidden no-underline text-inherit group h-full"
    >
      <div className="relative aspect-square bg-[#f8f8f8] overflow-hidden shrink-0">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 300px"
            unoptimized
          />
        )}
        {discount && (
          <span className={`absolute top-1 left-1 ${isCarousel ? 'text-[8px] px-1 py-0.5' : 'text-xs px-2 py-0.5'} font-bold rounded-md bg-red-500 text-white`}>
            -{discount}%
          </span>
        )}
        {!isCarousel && (
          <span className={`absolute top-1 right-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${storeColors[product.store] || 'bg-gray-100 text-gray-800'}`}>
            {product.store}
          </span>
        )}
      </div>

      <div className={`${isCarousel ? 'p-1.5' : 'p-3'} space-y-1 flex flex-col flex-1`}>
        <h3 className={`${isCarousel ? 'text-[10px]' : 'text-sm'} font-medium leading-tight line-clamp-1 group-hover:text-gray-600 transition-colors`}>
          {product.name}
        </h3>

        <div className="flex items-baseline gap-0.5">
          <span className={`${isCarousel ? 'text-[11px]' : 'text-lg'} font-bold text-[#1a1a1a]`}>
            R$ {product.price.toFixed(2)}
          </span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-[8px] text-gray-400 line-through">
              R$ {product.oldPrice.toFixed(2)}
            </span>
          )}
        </div>

        {!isCarousel && product.coupon && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-green-700">
              Cupom: {product.coupon}
              {product.couponCode && (
                <span className="ml-1 font-mono bg-green-200 px-1 py-0.5 rounded text-[10px]">
                  {product.couponCode}
                </span>
              )}
            </span>
          </div>
        )}

        {!isCarousel && (
          <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
            {product.rating && (
              <span className="flex items-center gap-0.5">
                <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {product.rating.toFixed(1)}
              </span>
            )}
            {product.freeShipping && (
              <span className="text-green-600 font-medium">Frete Grátis</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-0.5">
          <span className={`block w-full text-center font-semibold bg-[#1a1a1a] text-white rounded-md transition-colors ${isCarousel ? 'text-[8px] py-1' : 'text-xs py-2'} group-hover:bg-gray-800`}>
            {isCarousel ? 'Ver' : 'Comprar'}
          </span>
        </div>
      </div>
    </a>
  )
}
