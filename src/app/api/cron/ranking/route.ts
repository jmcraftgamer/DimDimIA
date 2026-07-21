import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { ALL_CATEGORIES } from '../../../../worker/categories'
import { chatWithJSON, MODELS, SYSTEM_PROMPTS } from '../../../../lib/openhauter'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET() {
  const results: { category: string; subcategory: string; ranked: number }[] = []

  for (const cat of ALL_CATEGORIES) {
    for (const sub of cat.subcategories) {
      try {
        const products = await prisma.product.findMany({
          where: { category: cat.slug, subcategory: sub.name, isActive: true },
          orderBy: { price: 'asc' },
          take: 30,
        })

        if (products.length < 2) continue

        const productsJSON = JSON.stringify(products.map(p => ({
          name: p.name, price: p.price, oldPrice: p.oldPrice, store: p.store,
          rating: p.rating, totalSales: p.totalSales, freeShipping: p.freeShipping,
          coupon: p.coupon, isPromoted: p.isPromoted,
        })))

        const ranked = await chatWithJSON<any[]>(
          MODELS.PRODUCT_SEARCH,
          [{ role: 'user', content: `Reavalie e retorne TOP 5:\n\n${productsJSON}` }],
          `${SYSTEM_PROMPTS.PRODUCT_SEARCH}\n\nCATEGORIA: ${cat.name}\nSUBCATEGORIA: ${sub.name}`
        )

        if (!ranked || !Array.isArray(ranked) || ranked.length === 0) continue

        await prisma.product.updateMany({
          where: { category: cat.slug, subcategory: sub.name },
          data: { position: null, score: null },
        })

        for (let i = 0; i < ranked.length; i++) {
          const r = ranked[i]
          const match = products.find(p =>
            (r.name && p.name.includes(r.name.substring(0, 30)))
          )
          if (match) {
            await prisma.product.update({
              where: { id: match.id },
              data: {
                score: r.score ?? 100 - i * 20,
                position: i + 1,
                reason: r.reason || null,
                price: r.price ?? match.price,
                oldPrice: r.oldPrice ?? match.oldPrice,
                freeShipping: r.freeShipping ?? match.freeShipping,
                coupon: r.coupon ?? match.coupon,
                lastVerified: new Date(),
              },
            })
          }
        }

        results.push({ category: cat.slug, subcategory: sub.name, ranked: ranked.length })
      } catch (err) {
        console.error(`[Ranking] Error ${cat.slug}/${sub.name}:`, err)
      }
    }
  }

  return NextResponse.json({
    success: true,
    categoriesProcessed: results.length,
    details: results,
  })
}
