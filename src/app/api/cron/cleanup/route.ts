import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const deactivated = await prisma.product.updateMany({
      where: {
        isActive: true,
        lastVerified: { lt: oneHourAgo },
      },
      data: { isActive: false },
    })

    const withoutPromotion = await prisma.product.updateMany({
      where: {
        isActive: true,
        isPromoted: false,
      },
      data: { isActive: false },
    })

    const deleted = await prisma.product.deleteMany({
      where: {
        isActive: false,
        lastVerified: { lt: oneHourAgo },
      },
    })

    return NextResponse.json({
      success: true,
      deactivated: deactivated.count,
      withoutPromotion: withoutPromotion.count,
      deleted: deleted.count,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
