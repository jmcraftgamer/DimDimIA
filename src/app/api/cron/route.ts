import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { scrapeMercadoLivre } from '../../../lib/scrapers/mercadolivre'
import { scrapeAmazon } from '../../../lib/scrapers/amazon'
import { scrapeShopee } from '../../../lib/scrapers/shopee'
import { scrapeAliExpress } from '../../../lib/scrapers/aliexpress'
import { scrapeKabum } from '../../../lib/scrapers/kabum'
import { scrapePichau } from '../../../lib/scrapers/pichau'
import { scrapeTerabyteShop } from '../../../lib/scrapers/terabyteshop'
import { ScrapedProduct } from '../../../types'
import { ALL_CATEGORIES } from '../../../worker/categories'
import { scrapeMLByCategory } from '../../../lib/scrapers/mercadolivre-api'
import { checkSeller } from '../../../lib/whitelist'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const STORES = [
  { name: 'Mercado Livre', scraper: scrapeMercadoLivre },
  { name: 'Amazon', scraper: scrapeAmazon },
  { name: 'Shopee', scraper: scrapeShopee },
  { name: 'AliExpress', scraper: scrapeAliExpress },
  { name: 'Kabum', scraper: scrapeKabum },
  { name: 'Pichau', scraper: scrapePichau },
  { name: 'TerabyteShop', scraper: scrapeTerabyteShop },
]

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

  try {
    let state = await prisma.cronState.findUnique({ where: { id: 'default' } })
    if (!state) {
      state = await prisma.cronState.create({ data: { id: 'default' } })
    }

    const raw = state.pendingApifyRun as any || {}
    let catIdx = typeof raw.categoryIdx === 'number' ? raw.categoryIdx : 0

    const cat = ALL_CATEGORIES[catIdx % ALL_CATEGORIES.length]

    const mlCategoryId = (cat as any).mlbCategoryId as string | undefined

    const mlProducts = mlCategoryId
      ? await scrapeMLByCategory(cat.slug, mlCategoryId)
      : []

    let mlSaved = 0
    if (mlProducts.length > 0) {
      const firstSub = cat.subcategories[0]
      const subName = firstSub?.name || 'geral'
      mlSaved = await saveProducts(mlProducts, cat.slug, subName)
    }

    const storePromises = STORES.flatMap(store =>
      cat.subcategories.slice(0, 2).flatMap(sub =>
        sub.queries.slice(0, 1).map(async query => {
          try {
            const products = await store.scraper(query)
            const withStore = products.map((p: ScrapedProduct) => ({ ...p, store: store.name }))
            return withStore.length > 0 ? saveProducts(withStore, cat.slug, sub.name) : 0
          } catch {
            return 0
          }
        })
      )
    )

    const storeResults = await Promise.allSettled(storePromises)
    for (const r of storeResults) {
      if (r.status === 'fulfilled') totalSaved += r.value
    }
    totalSaved += mlSaved

    catIdx++
    if (catIdx >= ALL_CATEGORIES.length) catIdx = 0

    await prisma.cronState.update({
      where: { id: 'default' },
      data: { pendingApifyRun: { categoryIdx: catIdx }, updatedAt: new Date() },
    })

    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
      category: cat.slug,
      mlCategoryId,
      mlProductsFound: mlProducts.length,
      mlSaved,
      storeQueries: storePromises.length,
      totalSaved,
      activeProducts,
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, elapsedMs: Date.now() - startTime })
  }
}
