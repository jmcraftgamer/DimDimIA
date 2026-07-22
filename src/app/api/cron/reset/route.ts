import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const deletedProducts = await prisma.product.deleteMany({})
    await prisma.priceHistory.deleteMany({})
    await prisma.productCategory.deleteMany({})
    await prisma.workerLog.deleteMany({})
    await prisma.cronState.deleteMany({})

    await prisma.cronState.create({ data: { id: 'default' } })

    return NextResponse.json({
      success: true,
      deletedProducts: deletedProducts.count,
      message: 'Banco limpo. Cron vai popular com promoções do zero.',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
