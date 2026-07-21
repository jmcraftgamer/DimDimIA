import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const query = searchParams.get('q')
    const store = searchParams.get('store')
    const showAll = searchParams.get('all') === 'true'

    if (query) {
      const dbProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          name: { contains: query, mode: 'insensitive' },
          ...(store ? { store } : {}),
        },
        orderBy: [
          { isPromoted: 'desc' },
          { score: { sort: 'desc', nulls: 'last' } },
          { price: 'asc' },
        ],
        take: 10000,
      })
      return NextResponse.json({ products: dbProducts })
    }

    const where: any = { isActive: true }
    if (category) where.category = category
    if (store) where.store = store

    if (showAll) {
      const products = await prisma.product.findMany({
        where,
        orderBy: [
          { isPromoted: 'desc' },
          { score: { sort: 'desc', nulls: 'last' } },
          { price: 'asc' },
        ],
        take: 10000,
      })
      return NextResponse.json({ products })
    }

    const promoted = await prisma.product.findMany({
      where: { ...where, isPromoted: true },
      orderBy: [{ score: { sort: 'desc', nulls: 'last' } }, { price: 'asc' }],
      take: 10000,
    })

    const topRanked = await prisma.product.findMany({
      where: { ...where, position: { gte: 1, lte: 5 } },
      orderBy: [{ position: 'asc' }, { score: { sort: 'desc', nulls: 'last' } }],
      take: 10000,
    })

    const seenIds = new Set<string>()
    const merged = [...promoted, ...topRanked].filter(p => {
      if (seenIds.has(p.id)) return false
      seenIds.add(p.id)
      return true
    })

    return NextResponse.json({ products: merged })
  } catch (error: any) {
    console.error('Products API error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json()

    const where: any = { isActive: true }
    if (category) where.category = category

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { isPromoted: 'desc' },
        { score: { sort: 'desc', nulls: 'last' } },
        { price: 'asc' },
      ],
      take: 10000,
    })

    return NextResponse.json({ products, count: products.length })
  } catch (error: any) {
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
