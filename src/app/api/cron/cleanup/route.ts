import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const deactivated = await prisma.product.updateMany({
      where: {
        isActive: true,
        lastVerified: { lt: twentyFourHoursAgo },
      },
      data: { isActive: false },
    })

    const deleted = await prisma.product.deleteMany({
      where: {
        isActive: false,
        lastVerified: { lt: twentyFourHoursAgo },
      },
    })

    return NextResponse.json({
      success: true,
      deactivated: deactivated.count,
      deleted: deleted.count,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
