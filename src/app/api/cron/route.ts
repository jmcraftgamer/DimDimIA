import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { ScrapedProduct } from '../../../types'
import {
  MLB_CATEGORIES,
  scrapeMLCategoryListings,
  scrapeMLApiSearchMulti,
  scrapeMLApiSearch,
} from '../../../lib/scrapers/mercadolivre-api'
import { checkSeller } from '../../../lib/whitelist'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function buildProductId(store: string, productUrl: string, name: string): string {
  if (productUrl) {
    const cleanUrl = productUrl.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 60)
    return `${store}-${cleanUrl}`
  }
  return `${store}-${name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40)}`
}

async function saveOrGetSeller(sellerName: string, store: string): Promise<string | null> {
  if (!sellerName || sellerName === store) return null
  const lower = sellerName.toLowerCase()
  let seller = await prisma.seller.findFirst({ where: { name: lower, store } })
  if (seller) return seller.id
  const check = checkSeller(sellerName, store)
  seller = await prisma.seller.create({
    data: { name: lower, store, isVerified: check.isSafe, isKnownBrand: check.reason.includes('Marca conhecida') },
  })
  return seller.id
}

function calcDesirability(discount: number, position?: number): number {
  const popularityBoost = position !== undefined ? Math.max(0, 1 - position / 1000) * 60 : 0
  return Math.round(discount * 0.4 + popularityBoost)
}

async function saveProducts(products: ScrapedProduct[], catSlug: string, subName: string): Promise<number> {
  let saved = 0
  for (const p of products) {
    if (!p.name || p.price <= 0) continue
    if (!p.oldPrice || p.oldPrice <= p.price) continue
    const discount = Math.round((1 - p.price / p.oldPrice) * 100)
    if (discount < 5) continue
    if ((p.availableQuantity ?? 0) < 50) continue
    const desirability = calcDesirability(discount, p.position)

    try {
      const id = buildProductId(p.store, p.productUrl, p.name)
      const existing = await prisma.product.findUnique({ where: { id } })
      const sellerId = await saveOrGetSeller(p.sellerName || p.store, p.store).catch(() => null)

      if (existing) {
        await prisma.product.update({
          where: { id },
          data: {
            price: p.price, oldPrice: p.oldPrice ?? existing.oldPrice,
            rating: p.rating ?? existing.rating, totalSales: p.totalSales ?? existing.totalSales,
            freeShipping: p.freeShipping ?? existing.freeShipping,
            coupon: p.coupon ?? existing.coupon, couponCode: p.couponCode ?? existing.couponCode,
            tax: p.tax ?? existing.tax, category: catSlug, subcategory: subName,
            isActive: true, isPromoted: true,
            sellerId: sellerId ?? existing.sellerId, lastVerified: new Date(),
            score: desirability, position: p.position ?? existing.position,
            reason: `${discount}% OFF`,
            inStock: true,
          },
        })
      } else {
        await prisma.product.create({
          data: {
            id, name: p.name, description: p.description || p.name,
            price: p.price, oldPrice: p.oldPrice ?? null,
            category: catSlug, subcategory: subName, store: p.store,
            imageUrl: p.imageUrl || 'https://via.placeholder.com/200',
            productUrl: p.productUrl || '',
            rating: p.rating ?? null, totalSales: p.totalSales ?? null,
            freeShipping: p.freeShipping ?? null, coupon: p.coupon ?? null,
            couponCode: p.couponCode ?? null, tax: p.tax ?? null,
            isActive: true, isPromoted: true,
            inStock: true, sellerId: sellerId ?? null, lastVerified: new Date(),
            score: desirability, position: p.position ?? null,
            reason: `${discount}% OFF`,
          },
        })
      }
      saved++
    } catch (_) {}
  }
  return saved
}

export async function GET() {
  const startTime = Date.now()
  let totalSaved = 0
  const processed: string[] = []

  try {
    const t = Math.floor(Date.now() / 60000)
    const totalCats = MLB_CATEGORIES.length

    const catsPerCycle = 6
    const seen = new Set<string>()

    for (let i = 0; i < catsPerCycle; i++) {
      const idx = (t + i) % totalCats
      const cat = MLB_CATEGORIES[idx]
      if (!cat || seen.has(cat.id)) continue
      seen.add(cat.id)

      if (i % 2 === 0) {
        try {
          const products = await scrapeMLCategoryListings(cat.slug, cat.name, 25)
          processed.push(`Listings ${cat.name}: ${products.length} promos`)
          if (products.length > 0) totalSaved += await saveProducts(products, cat.slug, cat.name)
        } catch (err: any) {
          processed.push(`Listings ${cat.name}: ERRO ${err.message}`)
        }
      } else {
        try {
          const products = await scrapeMLApiSearchMulti(cat.id, cat.slug)
          processed.push(`API ${cat.name}: ${products.length} promos`)
          if (products.length > 0) totalSaved += await saveProducts(products, cat.slug, cat.name)
        } catch (err: any) {
          processed.push(`API ${cat.name}: ERRO ${err.message}`)
        }
      }

      const elapsed = Date.now() - startTime
      if (elapsed > 45000) {
        processed.push(`⚠️ Tempo limite próximo (${Math.round(elapsed / 1000)}s)`)
        break
      }
    }

    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
      processed,
      totalSaved,
      activeProducts,
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, elapsedMs: Date.now() - startTime })
  }
}
