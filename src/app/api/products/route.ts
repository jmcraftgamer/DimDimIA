import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const query = searchParams.get('q')
    const store = searchParams.get('store')
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get('limit') || '500')))

    const where: any = { isActive: true, isPromoted: true }
    if (category) where.category = category
    if (store) where.store = store

    if (query) {
      where.name = { contains: query, mode: 'insensitive' }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [
          { score: { sort: 'desc', nulls: 'last' } },
          { price: 'asc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({ products, total, offset, limit })
  } catch (error: any) {
    console.error('Products API error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json()
    const where: any = { isActive: true, isPromoted: true }
    if (category) where.category = category

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [
          { score: { sort: 'desc', nulls: 'last' } },
          { price: 'asc' },
        ],
        take: 500,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({ products, total, count: products.length })
  } catch (error: any) {
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
