import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { ScrapedProduct } from '../../../types'
import { MLB_CATEGORIES, scrapeMLByCategory } from '../../../lib/scrapers/mercadolivre-api'
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

async function saveProducts(products: ScrapedProduct[], catSlug: string, subName: string): Promise<number> {
  let saved = 0
  for (const p of products) {
    if (!p.name || p.price <= 0) continue
    if (!p.oldPrice || p.oldPrice <= p.price) continue
    const discount = Math.round((1 - p.price / p.oldPrice) * 100)
    if (discount < 5) continue

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
            score: discount,
            reason: `${discount}% OFF`,
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
            inStock: p.inStock !== false, sellerId: sellerId ?? null, lastVerified: new Date(),
            score: discount,
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
    let state = await prisma.cronState.findUnique({ where: { id: 'default' } })
    if (!state) {
      state = await prisma.cronState.create({ data: { id: 'default' } })
    }

    const raw = state.pendingApifyRun as any || {}
    let mlIdx = typeof raw.mlIdx === 'number' ? raw.mlIdx : 0

    const mlBatch = 3

    for (let b = 0; b < mlBatch; b++) {
      const mlCat = MLB_CATEGORIES[(mlIdx + b) % MLB_CATEGORIES.length]
      if (!mlCat) continue

      try {
        const products = await scrapeMLByCategory(mlCat.slug, mlCat.id)
        processed.push(`${mlCat.name} (${mlCat.id}): ${products.length} promos`)
        if (products.length > 0) {
          const saved = await saveProducts(products, mlCat.slug, mlCat.name)
          totalSaved += saved
        }
      } catch (err: any) {
        processed.push(`${mlCat.name}: ERRO ${err.message}`)
      }
    }

    mlIdx += mlBatch

    await prisma.cronState.update({
      where: { id: 'default' },
      data: { pendingApifyRun: { mlIdx }, updatedAt: new Date() },
    })

    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
      processed,
      mlIdx,
      totalCategories: MLB_CATEGORIES.length,
      totalSaved,
      activeProducts,
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, elapsedMs: Date.now() - startTime })
  }
}
