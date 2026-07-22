import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { scrapeOneStore } from '../../../lib/scrapers/index'
import { ScrapedProduct } from '../../../types'
import { ALL_CATEGORIES } from '../../../worker/categories'
import { startApifyRun, checkApifyRun, APIFY_ACTORS } from '../../../lib/apify'
import { autoclassifyProduct, ensureCategoryPath, linkProductToCategories } from '../../../lib/categorizer'
import { checkSeller } from '../../../lib/whitelist'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

const MAX_MS = 9000
const KABUM_IDX = 4
const ALIEXPRESS_IDX = 3
const ML_IDX = 0
const PICHAN_IDX = 5
const TERABYTE_IDX = 6

function detectPromoted(p: ScrapedProduct): boolean {
  return !!(p.oldPrice || p.coupon || p.couponCode)
}

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

async function savePriceHistory(productId: string, price: number, oldPrice: number | null | undefined): Promise<void> {
  await prisma.priceHistory.create({ data: { productId, price, oldPrice: oldPrice ?? null } })
}

async function saveProducts(products: ScrapedProduct[], catSlug: string, subName: string): Promise<number> {
  let saved = 0
  for (const p of products) {
    if (!p.name || p.price <= 0) continue
    const isPromoted = detectPromoted(p)
    try {
      const id = buildProductId(p.store, p.productUrl, p.name)
      const existing = await prisma.product.findUnique({ where: { id } })
      const [catPath, sellerId] = await Promise.all([
        existing || !isPromoted ? null : autoclassifyProduct(p.name, p.description).catch(() => null),
        saveOrGetSeller(p.sellerName || p.store, p.store).catch(() => null),
      ])
      if (existing) {
        await prisma.product.update({
          where: { id },
          data: {
            price: p.price, oldPrice: p.oldPrice ?? existing.oldPrice,
            rating: p.rating ?? existing.rating, totalSales: p.totalSales ?? existing.totalSales,
            freeShipping: p.freeShipping ?? existing.freeShipping,
            coupon: p.coupon ?? existing.coupon, couponCode: p.couponCode ?? existing.couponCode,
            tax: p.tax ?? existing.tax, category: catSlug, subcategory: subName,
            isActive: p.inStock !== false, isPromoted: isPromoted || existing.isPromoted,
            sellerId: sellerId ?? existing.sellerId, lastVerified: new Date(),
          },
        })
        await savePriceHistory(id, p.price, p.oldPrice)
      } else {
        const product = await prisma.product.create({
          data: {
            id, name: p.name, description: p.description || p.name,
            price: p.price, oldPrice: p.oldPrice ?? null,
            category: catSlug, subcategory: subName, store: p.store,
            imageUrl: p.imageUrl || 'https://via.placeholder.com/200',
            productUrl: p.productUrl || '',
            rating: p.rating ?? null, totalSales: p.totalSales ?? null,
            freeShipping: p.freeShipping ?? null, coupon: p.coupon ?? null,
            couponCode: p.couponCode ?? null, tax: p.tax ?? null,
            isActive: p.inStock !== false, isPromoted,
            inStock: p.inStock !== false, sellerId: sellerId ?? null, lastVerified: new Date(),
          },
        })
        await savePriceHistory(product.id, p.price, p.oldPrice)
        if (catPath && catPath.length > 0) {
          const categoryIds = await ensureCategoryPath(catPath)
          await linkProductToCategories(product.id, categoryIds)
        }
      }
      saved++
    } catch (_) {}
  }
  return saved
}

async function checkPendingMLRuns(runs: any[]): Promise<{ saved: number; completed: any[]; remaining: any[] }> {
  let saved = 0
  const completed: any[] = []
  const remaining: any[] = []
  for (const run of runs) {
    try {
      const result = await checkApifyRun(APIFY_ACTORS.mercadolivre.actorId, run.runId, run.datasetId)
      if (result && result.status === 'SUCCEEDED' && result.items && result.items.length > 0) {
        const apifyProducts = result.items.map((item: any) => ({
          name: item.title || item.name || '', description: item.title || item.name || '',
          price: item.price || 0, oldPrice: item.original_price || item.originalPrice || undefined,
          store: 'Mercado Livre',
          imageUrl: item.thumbnail || item.image || 'https://via.placeholder.com/200',
          productUrl: item.url || item.permalink || '',
          rating: item.average_rating || item.rating || undefined,
          totalSales: item.sales || item.soldQuantity || undefined,
          freeShipping: item.shipping?.free_shipping || item.free_shipping || false,
          inStock: item.available !== false && item.stock !== 0,
        })).filter((p: any) => p.name && p.price > 0)
        if (apifyProducts.length > 0) {
          saved += await saveProducts(apifyProducts, run.catSlug, run.subName)
        }
        completed.push(run)
      } else if (result && (result.status === 'FAILED' || result.status === 'TIMED-OUT' || result.status === 'ABORTED')) {
        completed.push(run)
      } else {
        remaining.push(run)
      }
    } catch {
      remaining.push(run)
    }
  }
  return { saved, completed, remaining }
}

export async function GET() {
  const startTime = Date.now()
  let totalSaved = 0

  try {
    await prisma.product.updateMany({ where: { isActive: false }, data: { isActive: true } })

    let state = await prisma.cronState.findUnique({ where: { id: 'default' } })
    if (!state) {
      state = await prisma.cronState.create({ data: { id: 'default' } })
    }

    const raw = state.pendingApifyRun as any || {}
    let catIdx = typeof raw.categoryIdx === 'number' ? raw.categoryIdx : 0
    let mlRuns: any[] = Array.isArray(raw.mlRuns) ? raw.mlRuns : []

    if (mlRuns.length > 0) {
      const result = await checkPendingMLRuns(mlRuns)
      totalSaved += result.saved
      mlRuns = result.remaining
    }

    const cat = ALL_CATEGORIES[catIdx % ALL_CATEGORIES.length]

    const { findCategoryUrl: getKabumUrl } = await import('../../../lib/scrapers/kabum')
    const kabumDedup = new Map<string, { query: string; subName: string; catSlug: string }>()
    const aliQueries: { query: string; subName: string; catSlug: string }[] = []

    for (const sub of cat.subcategories) {
      for (const query of sub.queries) {
        aliQueries.push({ query, subName: sub.name, catSlug: cat.slug })
        const url = getKabumUrl(query)
        if (url && !kabumDedup.has(url)) {
          kabumDedup.set(url, { query, subName: sub.name, catSlug: cat.slug })
        }
      }
    }

    const kabumPromises = Array.from(kabumDedup.values()).map(async ({ query, subName, catSlug }) => {
      const products = await scrapeOneStore(query, KABUM_IDX)
      if (products.length > 0) {
        return saveProducts(products, catSlug, subName)
      }
      return 0
    })

    const aliPromises = aliQueries.map(async ({ query, subName, catSlug }) => {
      const products = await scrapeOneStore(query, ALIEXPRESS_IDX)
      if (products.length > 0) {
        return saveProducts(products, catSlug, subName)
      }
      return 0
    })

    const mlStartPromises = aliQueries.map(async ({ query, subName, catSlug }) => {
      const newRun = await startApifyRun(APIFY_ACTORS.mercadolivre.actorId, APIFY_ACTORS.mercadolivre.inputMapper(query))
      if (newRun && newRun.runId) {
        return { runId: newRun.runId, datasetId: newRun.datasetId, catSlug, subName, query, startedAt: new Date().toISOString() }
      }
      return null
    })

    const [kabumResults, aliResults, mlNewRuns] = await Promise.all([
      Promise.allSettled(kabumPromises),
      Promise.allSettled(aliPromises),
      Promise.allSettled(mlStartPromises),
    ])

    for (const r of kabumResults) {
      if (r.status === 'fulfilled') totalSaved += r.value
    }
    for (const r of aliResults) {
      if (r.status === 'fulfilled') totalSaved += r.value
    }
    for (const r of mlNewRuns) {
      if (r.status === 'fulfilled' && r.value) mlRuns.push(r.value)
    }

    catIdx++
    if (catIdx >= ALL_CATEGORIES.length) catIdx = 0

    await prisma.cronState.update({
      where: { id: 'default' },
      data: { pendingApifyRun: { categoryIdx: catIdx, mlRuns }, updatedAt: new Date() },
    })

    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
      category: cat.slug,
      nextCategory: ALL_CATEGORIES[catIdx].slug,
      kabumUrls: kabumDedup.size,
      aliQueries: aliQueries.length,
      totalSaved,
      activeProducts,
      pendingML: mlRuns.length,
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, elapsedMs: Date.now() - startTime })
  }
}
