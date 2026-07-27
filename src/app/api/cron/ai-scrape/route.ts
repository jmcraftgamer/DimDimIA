import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { scrapeMLCategoryListings, MLB_CATEGORIES } from '../../../../lib/scrapers/mercadolivre-api'
import { ScrapedProduct } from '../../../../types'
import { checkSeller } from '../../../../lib/whitelist'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

function shufflePick<T>(arr: T[], n: number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
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
            rating: p.rating ?? existing.rating,
            totalSales: p.totalSales ?? existing.totalSales,
            freeShipping: p.freeShipping ?? existing.freeShipping,
            category: catSlug, subcategory: subName,
            isActive: true, isPromoted: true,
            sellerId: sellerId ?? existing.sellerId,
            score: desirability, position: p.position ?? existing.position,
            reason: `${discount}% OFF`,
            lastVerified: new Date(),
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
            freeShipping: p.freeShipping ?? null,
            isActive: true, isPromoted: true,
            inStock: true, sellerId: sellerId ?? null,
            score: desirability, position: p.position ?? null,
            reason: `${discount}% OFF`,
            lastVerified: new Date(),
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
  const deadline = startTime + 8000

  try {
    const cats = shufflePick(MLB_CATEGORIES, 3)
    const logs: string[] = []
    let totalSaved = 0

    for (const cat of cats) {
      if (Date.now() > deadline) {
        logs.push(`${cat.name}: tempo`)
        break
      }

      const products = await scrapeMLCategoryListings(cat.slug, cat.name, 5)
      const saved = await saveProducts(products, cat.slug, cat.name)
      logs.push(`${cat.name}: ${saved} salvos (${products.length} encontrados)`)
      totalSaved += saved
    }

    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
      type: 'ai',
      logs,
      totalSaved,
      activeProducts,
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, elapsedMs: Date.now() - startTime })
  }
}
