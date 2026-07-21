import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, price: true, oldPrice: true, isPromoted: true, lastVerified: true },
    })

    let removed = 0
    let updated = 0
    let newPromoted = 0

    for (const p of allProducts) {
      if (p.oldPrice && p.oldPrice <= p.price) {
        await prisma.product.update({
          where: { id: p.id },
          data: { isPromoted: false, oldPrice: null },
        })
        removed++
      }
    }

    const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentProducts = await prisma.product.findMany({
      where: { createdAt: { gte: lastDay } },
      select: { id: true, store: true, name: true },
      take: 50,
    })

    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const staleRankings = await prisma.product.findMany({
      where: {
        position: { not: null },
        updatedAt: { lte: twoDaysAgo },
      },
      distinct: ['category', 'subcategory'],
      select: { category: true, subcategory: true },
    })

    return NextResponse.json({
      success: true,
      checkedProducts: allProducts.length,
      promotionsRemoved: removed,
      pricesUpdated: updated,
      recentNewProducts: recentProducts.length,
      staleRankingsCount: staleRankings.length,
      staleRankings,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
