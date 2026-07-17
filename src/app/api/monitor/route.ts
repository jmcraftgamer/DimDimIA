import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '../../../lib/prisma'
import { scrapeSpecificStore } from '../../../lib/scrapers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const monitors = await prisma.monitor.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ monitors })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const { name, url, store, targetPrice } = await request.json()

    if (!name || !url || !store) {
      return NextResponse.json({ error: 'Nome, URL e loja são obrigatórios' }, { status: 400 })
    }

    const monitor = await prisma.monitor.create({
      data: {
        name,
        url,
        store,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        userId: user.id,
      },
    })

    return NextResponse.json({ monitor })
  } catch (error: any) {
    console.error('Monitor POST error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const monitor = await prisma.monitor.findUnique({ where: { id } })
    if (!monitor) {
      return NextResponse.json({ error: 'Monitor não encontrado' }, { status: 404 })
    }

    const storeName = monitor.store
    const productName = monitor.name

    const results = await scrapeSpecificStore(storeName, productName)
    const foundProduct = results.length > 0
      ? results.sort((a: any, b: any) => a.price - b.price)[0]
      : null

    const currentPrice = foundProduct?.price ?? monitor.currentPrice ?? 0
    const onSale = monitor.targetPrice != null ? currentPrice <= monitor.targetPrice : false

    const updated = await prisma.monitor.update({
      where: { id },
      data: {
        currentPrice,
        onSale,
        lastChecked: new Date(),
      },
    })

    return NextResponse.json({ monitor: updated })
  } catch (error: any) {
    console.error('Monitor PUT error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    await prisma.monitor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
