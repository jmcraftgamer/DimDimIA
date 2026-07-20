import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { scrapeOneStore, ALL_STORES } from '../../../lib/scrapers/index'
import { ALL_CATEGORIES } from '../../../worker/categories'
import { chatWithJSON, MODELS, SYSTEM_PROMPTS } from '../../../lib/openhauter'
import { startApifyRun, checkApifyRun, APIFY_ACTORS } from '../../../lib/apify'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

const STORE_COUNT = ALL_STORES.length
const MAX_BATCH_MS = 8000

const ML_STORE_INDEX = 0

interface RankedProduct {
  name: string
  price: number
  oldPrice?: number
  store: string
  imageUrl: string
  productUrl: string
  rating?: number
  totalSales?: number
  freeShipping?: boolean
  coupon?: string
  couponCode?: string
  tax?: number
  score: number
  reason: string
}

export async function GET() {
  const startTime = Date.now()
  let batchesDone = 0
  let totalSaved = 0

  try {
    let state = await prisma.cronState.findUnique({ where: { id: 'default' } })
    if (!state) {
      state = await prisma.cronState.create({ data: { id: 'default' } })
    }

    while (Date.now() - startTime < MAX_BATCH_MS) {
      const result = await processOneStore(state)
      state = result.state
      totalSaved += result.saved
      batchesDone++

      if (result.done) break
    }

    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
      batchesDone,
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

async function saveApifyProducts(items: any[], catSlug: string, subName: string, query: string): Promise<number> {
  let saved = 0
  for (const item of items) {
    const name = item.title || item.name || ''
    const price = item.price || 0
    if (!name || price <= 0) continue

    const matchesQuery = query.toLowerCase().split(' ').some(
      (kw) => kw.length > 2 && name.toLowerCase().includes(kw)
    )
    if (!matchesQuery) continue

    try {
      const id = `Mercado Livre-${catSlug}-${subName}-${name.substring(0, 40)}`
      await prisma.product.upsert({
        where: { id },
        update: { price, isActive: true, lastVerified: new Date() },
        create: {
          id,
          name,
          description: name,
          price,
          category: catSlug,
          subcategory: subName,
          store: 'Mercado Livre',
          imageUrl: item.thumbnail || item.image || 'https://via.placeholder.com/200',
          productUrl: item.url || item.permalink || '',
          isActive: true,
          lastVerified: new Date(),
        },
      })
      saved++
    } catch (_) {}
  }
  return saved
}

async function processOneStore(state: any): Promise<{ state: any; saved: number; done: boolean }> {
  const totalCategories = ALL_CATEGORIES.length
  const cat = ALL_CATEGORIES[state.currentCategoryIdx % totalCategories]

  if (!cat || cat.subcategories.length === 0) {
    state = await resetState(state)
    return { state, saved: 0, done: false }
  }

  const sub = cat.subcategories[state.currentSubcategoryIdx % cat.subcategories.length]
  if (!sub || sub.queries.length === 0) {
    state = await advanceSubcategory(state, cat.subcategories.length, totalCategories)
    return { state, saved: 0, done: false }
  }

  const storeName = ALL_STORES[state.currentStoreIdx]?.name || ''
  const query = sub.queries[state.currentQueryIdx % sub.queries.length]
  const isML = state.currentStoreIdx === ML_STORE_INDEX

  const products = await scrapeOneStore(query, state.currentStoreIdx, isML)

  let saved = 0
  let fromAsyncRun = false

  if (products.length === 0 && isML) {
    const pendingRun = state.pendingApifyRun as any

    if (pendingRun && pendingRun.runId) {
      const result = await checkApifyRun(APIFY_ACTORS.mercadolivre.actorId, pendingRun.runId, pendingRun.datasetId)
      if (result && result.status === 'SUCCEEDED' && result.items && result.items.length > 0) {
        saved = await saveApifyProducts(result.items, pendingRun.categorySlug, pendingRun.subName, pendingRun.query)
        fromAsyncRun = true
        if (saved > 0) {
          await prisma.workerLog.create({
            data: {
              category: pendingRun.categorySlug,
              subcategory: pendingRun.subName,
              status: 'success',
              productsFound: result.items.length,
              productsSaved: saved,
              duration: Math.round((Date.now() - new Date(pendingRun.startedAt).getTime()) / 1000),
              message: `Mercado Livre (async):${pendingRun.query}`,
            },
          })
        }
        state = await prisma.cronState.update({
          where: { id: 'default' },
          data: { pendingApifyRun: Prisma.JsonNull, updatedAt: new Date() },
        })
      } else if (result && (result.status === 'FAILED' || result.status === 'TIMED-OUT' || result.status === 'ABORTED')) {
        state = await prisma.cronState.update({
          where: { id: 'default' },
          data: { pendingApifyRun: Prisma.JsonNull, updatedAt: new Date() },
        })
      }
    }

    if (!state.pendingApifyRun) {
      const newRun = await startApifyRun(APIFY_ACTORS.mercadolivre.actorId, APIFY_ACTORS.mercadolivre.inputMapper(query))
      if (newRun && newRun.runId) {
        state = await prisma.cronState.update({
          where: { id: 'default' },
          data: {
            pendingApifyRun: {
              runId: newRun.runId,
              datasetId: newRun.datasetId,
              store: 'Mercado Livre',
              query,
              categorySlug: cat.slug,
              subName: sub.name,
              storeIdx: state.currentStoreIdx,
              startedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          },
        })
      }
    }
  }

  if (!fromAsyncRun) {
    for (const p of products) {
      const matchesQuery = query.toLowerCase().split(' ').some(
        (kw) => kw.length > 2 && p.name.toLowerCase().includes(kw)
      )
      if (!matchesQuery) continue

      try {
        const id = `${p.store}-${cat.slug}-${sub.name}-${p.name.substring(0, 40)}`
        const existing = await prisma.product.findUnique({ where: { id } })

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
              isActive: true,
              lastVerified: new Date(),
            },
          })
        } else {
          await prisma.product.create({
            data: {
              id,
              name: p.name,
              description: p.description,
              price: p.price,
              oldPrice: p.oldPrice ?? null,
              category: cat.slug,
              subcategory: sub.name,
              store: p.store,
              imageUrl: p.imageUrl,
              productUrl: p.productUrl,
              rating: p.rating ?? null,
              totalSales: p.totalSales ?? null,
              freeShipping: p.freeShipping ?? null,
              coupon: p.coupon ?? null,
              couponCode: p.couponCode ?? null,
              tax: p.tax ?? null,
              isActive: true,
              lastVerified: new Date(),
            },
          })
        }
        saved++
      } catch (_) {}
    }

    if (!fromAsyncRun) {
      await prisma.workerLog.create({
        data: {
          category: cat.slug,
          subcategory: sub.name,
          status: products.length > 0 ? 'success' : 'no_products',
          productsFound: products.length,
          productsSaved: saved,
          duration: 0,
          message: `${storeName}:${query}`,
        },
      })
    }
  }

  const nextStoreIdx = state.currentStoreIdx + 1
  let done = false

  if (nextStoreIdx >= STORE_COUNT) {
    const nextQueryIdx = state.currentQueryIdx + 1
    if (nextQueryIdx >= sub.queries.length) {
      const catName = cat.name
      const subName = sub.name
      state = await advanceSubcategory(state, cat.subcategories.length, totalCategories)
      runAIRankerInBackground(cat.slug, subName)
    } else {
      state = await prisma.cronState.update({
        where: { id: 'default' },
        data: { currentStoreIdx: 0, currentQueryIdx: nextQueryIdx, updatedAt: new Date() },
      })
    }
  } else {
    state = await prisma.cronState.update({
      where: { id: 'default' },
      data: { currentStoreIdx: nextStoreIdx, updatedAt: new Date() },
    })
  }

  done = false

  return { state, saved, done }
}

async function advanceSubcategory(state: any, subLen: number, catLen: number) {
  const nextSubIdx = (state.currentSubcategoryIdx + 1) % subLen
  let nextCatIdx = state.currentCategoryIdx
  let resetSub = false

  if (nextSubIdx === 0 && subLen > 0) {
    nextCatIdx = (state.currentCategoryIdx + 1) % catLen
    resetSub = true
  }

  const newCycle = nextCatIdx === 0 && resetSub ? state.cycleCount + 1 : state.cycleCount

  return prisma.cronState.update({
    where: { id: 'default' },
    data: {
      currentCategoryIdx: nextCatIdx,
      currentSubcategoryIdx: resetSub ? 0 : nextSubIdx,
      currentStoreIdx: 0,
      currentQueryIdx: 0,
      cycleCount: newCycle,
      updatedAt: new Date(),
    },
  })
}

async function resetState(state: any) {
  return prisma.cronState.update({
    where: { id: 'default' },
    data: {
      currentCategoryIdx: (state.currentCategoryIdx + 1) % ALL_CATEGORIES.length,
      currentSubcategoryIdx: 0,
      currentStoreIdx: 0,
      currentQueryIdx: 0,
      updatedAt: new Date(),
    },
  })
}

async function runAIRankerInBackground(categorySlug: string, subcategoryName: string) {
  try {
    const products = await prisma.product.findMany({
      where: { category: categorySlug, subcategory: subcategoryName, isActive: true },
      orderBy: { price: 'asc' },
      take: 30,
    })
    if (products.length < 2) return

    const cat = ALL_CATEGORIES.find((c) => c.slug === categorySlug)
    const catName = cat?.name || categorySlug

    const productsJSON = JSON.stringify(
      products.map((p) => ({
        name: p.name,
        price: p.price,
        oldPrice: p.oldPrice,
        store: p.store,
        rating: p.rating,
        totalSales: p.totalSales,
        freeShipping: p.freeShipping,
        coupon: p.coupon,
        tax: p.tax,
      }))
    )

    const result = await chatWithJSON<RankedProduct[]>(
      MODELS.PRODUCT_SEARCH,
      [{ role: 'user', content: `Analise e retorne TOP 5:\n\n${productsJSON}` }],
      `${SYSTEM_PROMPTS.PRODUCT_SEARCH}\n\nCATEGORIA: ${catName}\nSUBCATEGORIA: ${subcategoryName}`
    )

    if (!result || !Array.isArray(result) || result.length === 0) return

    for (let i = 0; i < result.length; i++) {
      const r = result[i]
      const existing = products.find(
        (p) =>
          (r.name && p.name.includes(r.name.substring(0, 30))) ||
          (r.store && p.store === r.store && p.name.includes(r.name?.substring(0, 20) || ''))
      )
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            score: r.score ?? 100 - i * 20,
            reason: r.reason || null,
            position: i + 1,
            isActive: true,
            price: r.price ?? existing.price,
            oldPrice: r.oldPrice ?? existing.oldPrice,
            freeShipping: r.freeShipping ?? existing.freeShipping,
            coupon: r.coupon ?? existing.coupon,
            couponCode: r.couponCode ?? existing.couponCode,
            lastVerified: new Date(),
          },
        })
      }
    }
  } catch (_) {}
}
