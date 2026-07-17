import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { ALL_CATEGORIES } from '../../../worker/categories'
import { ALL_STORES } from '../../../lib/scrapers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const totalProducts = await prisma.product.count({ where: { isActive: true } })
    const totalInactive = await prisma.product.count({ where: { isActive: false } })
    const totalMonitors = await prisma.monitor.count()
    const totalUsers = await prisma.user.count()

    const recentLogs = await prisma.workerLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    const lastLog = recentLogs[0]

    const categoryCounts = await prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    const state = await prisma.cronState.findUnique({ where: { id: 'default' } })
    let progressInfo = null

    if (state) {
      const totalCategories = ALL_CATEGORIES.length
      const cat = ALL_CATEGORIES[state.currentCategoryIdx % totalCategories]
      const totalSubs = ALL_CATEGORIES.reduce((acc, c) => acc + c.subcategories.length, 0)
      const processedSubs = ALL_CATEGORIES
        .slice(0, state.currentCategoryIdx)
        .reduce((acc, c) => acc + c.subcategories.length, 0) + state.currentSubcategoryIdx

      progressInfo = {
        currentCategory: cat?.name || 'N/A',
        currentSubcategory: cat?.subcategories[state.currentSubcategoryIdx % cat.subcategories.length]?.name || 'N/A',
        currentStore: ALL_STORES[state.currentStoreIdx]?.name || 'N/A',
        storeIndex: state.currentStoreIdx,
        totalStores: ALL_STORES.length,
        totalSubs,
        processedSubs,
        cycleCount: state.cycleCount,
      }
    }

    return NextResponse.json({
      mode: 'cron',
      stats: {
        activeProducts: totalProducts,
        inactiveProducts: totalInactive,
        monitors: totalMonitors,
        users: totalUsers,
      },
      categories: categoryCounts.map((c) => ({
        name: c.category,
        count: c._count.id,
      })),
      progress: progressInfo,
      lastRun: lastLog
        ? {
            category: lastLog.category,
            subcategory: lastLog.subcategory,
            status: lastLog.status,
            found: lastLog.productsFound,
            saved: lastLog.productsSaved,
            time: lastLog.createdAt,
          }
        : null,
      recentLogs: recentLogs.slice(0, 15),
    })
  } catch (error: any) {
    console.error('Worker status error:', error)
    return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
  }
}
