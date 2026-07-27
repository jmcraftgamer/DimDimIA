import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { divideCategoriesIntoGroups, runAgent } from '../../../../lib/ai-agent'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

const AGENTS_LIGHT = 4

export async function GET() {
  const startTime = Date.now()

  try {
    const groups = divideCategoriesIntoGroups(AGENTS_LIGHT)

    const agentPromises = groups.map((group, i) =>
      runAgent(i, group.groupName, group.categories)
    )

    const agentResults = await Promise.all(agentPromises)

    const totalSaved = agentResults.reduce((s: number, r: any) => s + r.productsFound, 0)
    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
      type: 'ai',
      agents: agentResults.map((r: any) => ({
        id: r.agentId,
        group: r.groupName,
        queries: r.queriesGenerated,
        saved: r.productsFound,
        error: r.error || null,
      })),
      totalSaved,
      activeProducts,
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, elapsedMs: Date.now() - startTime })
  }
}
