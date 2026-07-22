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

const MAX_BATCH_MS = 8000
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

  let seller = await prisma.seller.findFirst({
    where: { name: lower, store },
  })
  if (seller) return seller.id

  const check = checkSeller(sellerName, store)
  seller = await prisma.seller.create({
    data: {
      name: lower,
      store,
      isVerified: check.isSafe,
      isKnownBrand: check.reason.includes('Marca conhecida'),
    },
  })
  return seller.id
}

async function savePriceHistory(productId: string, price: number, oldPrice: number | null | undefined): Promise<void> {
  await prisma.priceHistory.create({
    data: { productId, price, oldPrice: oldPrice ?? null },
  })
}

async function saveProducts(products: ScrapedProduct[], catSlug: string, subName: string): Promise<number> {
  let saved = 0
  const nonPromoted: ScrapedProduct[] = []

  for (const p of products) {
    if (!p.name || p.price <= 0) continue
    const isPromoted = detectPromoted(p)

    if (!isPromoted) {
      nonPromoted.push(p)
      continue
    }

    try {
      const id = buildProductId(p.store, p.productUrl, p.name)
      const existing = await prisma.product.findUnique({ where: { id } })

      const [catPath, sellerId] = await Promise.all([
        existing ? null : autoclassifyProduct(p.name, p.description).catch(() => null),
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
            isPromoted: true,
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
            isPromoted: true,
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

  if (nonPromoted.length > 0) {
    nonPromoted.sort((a, b) => a.price - b.price)
    const best = nonPromoted[0]
    try {
      const id = buildProductId(best.store, best.productUrl, best.name)
      const existing = await prisma.product.findUnique({ where: { id } })
      if (existing && existing.isPromoted) return saved

      if (existing) {
        await prisma.product.update({
          where: { id },
          data: {
            price: best.price,
            rating: best.rating ?? existing.rating,
            totalSales: best.totalSales ?? existing.totalSales,
            freeShipping: best.freeShipping ?? existing.freeShipping,
            category: catSlug,
            subcategory: subName,
            isActive: best.inStock !== false,
            isPromoted: false,
            lastVerified: new Date(),
          },
        })
      } else {
        await prisma.product.create({
          data: {
            id,
            name: best.name,
            description: best.description || best.name,
            price: best.price,
            oldPrice: best.oldPrice ?? null,
            category: catSlug,
            subcategory: subName,
            store: best.store,
            imageUrl: best.imageUrl || 'https://via.placeholder.com/200',
            productUrl: best.productUrl || '',
            rating: best.rating ?? null,
            totalSales: best.totalSales ?? null,
            freeShipping: best.freeShipping ?? null,
            coupon: best.coupon ?? null,
            couponCode: best.couponCode ?? null,
            tax: best.tax ?? null,
            isActive: best.inStock !== false,
            isPromoted: false,
            inStock: best.inStock !== false,
            lastVerified: new Date(),
          },
        })
      }
    } catch (_) {}
  }

  return saved
}

function buildJobList() {
  const jobs: { catSlug: string; catName: string; subName: string; query: string }[] = []
  for (const cat of ALL_CATEGORIES) {
    for (const sub of cat.subcategories) {
      for (const query of sub.queries) {
        jobs.push({ catSlug: cat.slug, catName: cat.name, subName: sub.name, query })
      }
    }
  }
  return jobs
}

async function processJob(job: { catSlug: string; catName: string; subName: string; query: string }): Promise<number> {
  let totalSaved = 0

  const storePromises = ALL_STORES.map(async (store, storeIdx) => {
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
            const saved = await saveProducts(apifyProducts, job.catSlug, job.subName)
            totalSaved += saved
          }
        }
      }
    }

    if (products.length > 0) {
      const saved = await saveProducts(products, job.catSlug, job.subName)
      totalSaved += saved
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
    await prisma.product.updateMany({
      where: { isPromoted: false },
      data: { isActive: false },
    })

    let state = await prisma.cronState.findUnique({ where: { id: 'default' } })
    if (!state) {
      state = await prisma.cronState.create({ data: { id: 'default' } })
    }

    if (state.pendingApifyRun && typeof state.pendingApifyRun === 'object' && 'seeded' in (state.pendingApifyRun as any) && (state.pendingApifyRun as any).seeded) {
      return NextResponse.json({
        success: true,
        seeded: true,
        message: 'Full scan already completed. Daily maintenance only.',
        elapsedMs: Date.now() - startTime,
      })
    }

    const allJobs = buildJobList()
    let jobIdx: number

    if (state.pendingApifyRun && typeof state.pendingApifyRun === 'object' && 'jobIdx' in (state.pendingApifyRun as any)) {
      jobIdx = (state.pendingApifyRun as any).jobIdx
    } else {
      jobIdx = 0
    }

    while (Date.now() - startTime < MAX_BATCH_MS && jobIdx < allJobs.length) {
      const job = allJobs[jobIdx]
      const saved = await processJob(job)
      totalSaved += saved
      processedJobs++
      jobIdx++

      await prisma.cronState.update({
        where: { id: 'default' },
        data: { pendingApifyRun: { jobIdx }, updatedAt: new Date() },
      })
    }

    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    if (jobIdx >= allJobs.length) {
      await prisma.cronState.update({
        where: { id: 'default' },
        data: { pendingApifyRun: { seeded: true, jobIdx }, updatedAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      seeded: jobIdx >= allJobs.length,
      progress: `${jobIdx}/${allJobs.length}`,
      processedJobs,
      totalSaved,
      activeProducts,
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      elapsedMs: Date.now() - startTime,
    })
  }
}
