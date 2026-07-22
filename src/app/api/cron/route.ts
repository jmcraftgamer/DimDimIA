import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { scrapeOneStore, ALL_STORES } from '../../../lib/scrapers/index'
import { ScrapedProduct } from '../../../types'
import { ALL_CATEGORIES } from '../../../worker/categories'
import { startApifyRun, checkApifyRun, APIFY_ACTORS } from '../../../lib/apify'
import { autoclassifyProduct, ensureCategoryPath, linkProductToCategories } from '../../../lib/categorizer'
import { checkSeller } from '../../../lib/whitelist'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

const MAX_BATCH_MS = 9000
const ML_STORE_INDEX = 0

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
            price: p.price,
            oldPrice: p.oldPrice ?? existing.oldPrice,
            rating: p.rating ?? existing.rating,
            totalSales: p.totalSales ?? existing.totalSales,
            freeShipping: p.freeShipping ?? existing.freeShipping,
            coupon: p.coupon ?? existing.coupon,
            couponCode: p.couponCode ?? existing.couponCode,
            tax: p.tax ?? existing.tax,
            category: catSlug,
            subcategory: subName,
            isActive: p.inStock !== false,
            isPromoted: isPromoted || existing.isPromoted,
            sellerId: sellerId ?? existing.sellerId,
            lastVerified: new Date(),
          },
        })
        await savePriceHistory(id, p.price, p.oldPrice)
      } else {
        const product = await prisma.product.create({
          data: {
            id,
            name: p.name,
            description: p.description || p.name,
            price: p.price,
            oldPrice: p.oldPrice ?? null,
            category: catSlug,
            subcategory: subName,
            store: p.store,
            imageUrl: p.imageUrl || 'https://via.placeholder.com/200',
            productUrl: p.productUrl || '',
            rating: p.rating ?? null,
            totalSales: p.totalSales ?? null,
            freeShipping: p.freeShipping ?? null,
            coupon: p.coupon ?? null,
            couponCode: p.couponCode ?? null,
            tax: p.tax ?? null,
            isActive: p.inStock !== false,
            isPromoted,
            inStock: p.inStock !== false,
            sellerId: sellerId ?? null,
            lastVerified: new Date(),
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

function buildJobList() {
  const jobs: { catSlug: string; catName: string; subName: string; query: string }[] = []
  for (const cat of ALL_CATEGORIES) {
    for (const sub of cat.subcategories) {
      const unique = new Set<string>()
      for (const query of sub.queries) {
        if (!unique.has(query)) {
          unique.add(query)
          jobs.push({ catSlug: cat.slug, catName: cat.name, subName: sub.name, query })
        }
      }
    }
  }
  return jobs
}

async function processJob(job: { catSlug: string; catName: string; subName: string; query: string }): Promise<number> {
  let totalSaved = 0

  const storePromises = ALL_STORES.map(async (_, storeIdx) => {
    const isML = storeIdx === ML_STORE_INDEX
    const products = await scrapeOneStore(job.query, storeIdx, isML)

    if (products.length === 0 && isML) {
      const newRun = await startApifyRun(APIFY_ACTORS.mercadolivre.actorId, APIFY_ACTORS.mercadolivre.inputMapper(job.query))
      if (newRun && newRun.runId) {
        const result = await checkApifyRun(APIFY_ACTORS.mercadolivre.actorId, newRun.runId, newRun.datasetId)
        if (result && result.status === 'SUCCEEDED' && result.items) {
          const apifyProducts = result.items.map((item: any) => ({
            name: item.title || item.name || '',
            description: item.title || item.name || '',
            price: item.price || 0,
            oldPrice: item.original_price || item.originalPrice || undefined,
            store: 'Mercado Livre',
            imageUrl: item.thumbnail || item.image || 'https://via.placeholder.com/200',
            productUrl: item.url || item.permalink || '',
            rating: item.average_rating || item.rating || undefined,
            totalSales: item.sales || item.soldQuantity || undefined,
            freeShipping: item.shipping?.free_shipping || item.free_shipping || false,
            inStock: item.available !== false && item.stock !== 0,
          })).filter((p: any) => p.name && p.price > 0)
          if (apifyProducts.length > 0) {
            totalSaved += await saveProducts(apifyProducts, job.catSlug, job.subName)
          }
        }
      }
    }

    if (products.length > 0) {
      totalSaved += await saveProducts(products, job.catSlug, job.subName)
    }
  })

  await Promise.allSettled(storePromises)
  return totalSaved
}

export async function GET() {
  const startTime = Date.now()
  let totalSaved = 0
  let processedJobs = 0

  try {
    await prisma.product.updateMany({ where: { isActive: false }, data: { isActive: true } })

    let state = await prisma.cronState.findUnique({ where: { id: 'default' } })
    if (!state) {
      state = await prisma.cronState.create({ data: { id: 'default' } })
    }

    const allJobs = buildJobList()
    let jobIdx = 0
    if (state.pendingApifyRun && typeof state.pendingApifyRun === 'object') {
      const p = state.pendingApifyRun as any
      if (typeof p.jobIdx === 'number') jobIdx = p.jobIdx
      if (jobIdx >= allJobs.length) jobIdx = 0
    }

    while (Date.now() - startTime < MAX_BATCH_MS && jobIdx < allJobs.length) {
      const saved = await processJob(allJobs[jobIdx])
      totalSaved += saved
      processedJobs++
      jobIdx++
    }

    const nextIdx = jobIdx >= allJobs.length ? 0 : jobIdx
    await prisma.cronState.update({
      where: { id: 'default' },
      data: { pendingApifyRun: { jobIdx: nextIdx }, updatedAt: new Date() },
    })

    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
      progress: `${jobIdx}/${allJobs.length}${jobIdx >= allJobs.length ? ' (reiniciando)' : ''}`,
      processedJobs,
      totalSaved,
      activeProducts,
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, elapsedMs: Date.now() - startTime })
  }
}
