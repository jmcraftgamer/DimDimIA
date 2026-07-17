import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { searchProducts } from '../../../lib/scrapers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const query = searchParams.get('q')
    const store = searchParams.get('store')
    const active = searchParams.get('active')

    if (query) {
      const products = await searchProducts(query)
      if (products.length > 0) {
        for (const p of products) {
          await prisma.product.upsert({
            where: { id: `${p.store}-${p.name.substring(0, 50)}` },
            update: {
              price: p.price,
              oldPrice: p.oldPrice || null,
              coupon: p.coupon || null,
              couponCode: p.couponCode || null,
              rating: p.rating || null,
              totalSales: p.totalSales || null,
              freeShipping: p.freeShipping || null,
              tax: p.tax || null,
              lastVerified: new Date(),
            },
            create: {
              id: `${p.store}-${p.name.substring(0, 50)}`,
              name: p.name,
              description: p.description,
              price: p.price,
              oldPrice: p.oldPrice || null,
              category: 'geral',
              store: p.store,
              imageUrl: p.imageUrl,
              productUrl: p.productUrl,
              rating: p.rating || null,
              totalSales: p.totalSales || null,
              freeShipping: p.freeShipping || null,
              tax: p.tax || null,
            },
          })
        }
      }
      return NextResponse.json({ products })
    }

    const where: any = {}
    if (category) where.category = category
    if (store) where.store = store
    if (active === 'true') where.isActive = true

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { score: { sort: 'desc', nulls: 'last' } },
        { price: 'asc' },
      ],
      take: 50,
    })

    return NextResponse.json({ products })
  } catch (error: any) {
    console.error('Products API error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json()

    const searchQueries: Record<string, string[]> = {
      eletrodomesticos: ['geladeira', 'fogão', 'microondas', 'lavadora', 'aspirador'],
      eletronicos: ['notebook', 'tablet', 'smartwatch', 'câmera', 'tv'],
      celulares: ['iphone', 'samsung galaxy', 'xiaomi', 'motorola'],
      fones: ['fone de ouvido', 'headset', 'earphone', 'airpods'],
      informatica: ['processador', 'placa de vídeo', 'ssd', 'memória ram', 'monitor'],
      games: ['playstation', 'xbox', 'nintendo', 'game', 'controle'],
      casa: ['sofá', 'cadeira', 'mesa', 'cama', 'luminária'],
      moda: ['tênis', 'relógio', 'mochila', 'bolsa'],
    }

    const categories = category ? [category] : Object.keys(searchQueries)
    const allResults: any[] = []

    for (const cat of categories) {
      const queries = searchQueries[cat] || ['produto']
      for (const q of queries) {
        const results = await searchProducts(q)
        const filtered = results.filter((p: any) => {
          const pLower = p.name.toLowerCase()
          return q.split(' ').some((kw) => pLower.includes(kw.toLowerCase()))
        })

        for (const p of filtered) {
          try {
            await prisma.product.upsert({
              where: { id: `${p.store}-${p.name.substring(0, 50)}` },
              update: {
                price: p.price,
                oldPrice: p.oldPrice || null,
                category: cat,
                coupon: p.coupon || null,
                couponCode: p.couponCode || null,
                rating: p.rating || null,
                totalSales: p.totalSales || null,
                freeShipping: p.freeShipping || null,
                isActive: true,
                lastVerified: new Date(),
              },
              create: {
                id: `${p.store}-${p.name.substring(0, 50)}`,
                name: p.name,
                description: p.description,
                price: p.price,
                oldPrice: p.oldPrice || null,
                category: cat,
                store: p.store,
                imageUrl: p.imageUrl,
                productUrl: p.productUrl,
                coupon: p.coupon || null,
                couponCode: p.couponCode || null,
                rating: p.rating || null,
                totalSales: p.totalSales || null,
                freeShipping: p.freeShipping || null,
                isActive: true,
                lastVerified: new Date(),
              },
            })
            allResults.push(p)
          } catch (e) {
            // ignore upsert errors
          }
        }
      }
    }

    return NextResponse.json({ products: allResults, count: allResults.length })
  } catch (error: any) {
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
