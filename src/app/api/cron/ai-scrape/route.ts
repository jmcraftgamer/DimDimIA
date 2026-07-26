import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { divideCategoriesIntoGroups, runAgent, AGENTS_COUNT } from '../../../../lib/ai-agent'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  try {
    const groups = divideCategoriesIntoGroups(AGENTS_COUNT)

    const agentPromises = groups.map((group, i) => {
      const delay = i * 500
      return new Promise<any>(resolve =>
        setTimeout(() => resolve(runAgent(i, group.groupName, group.categories)), delay)
      )
    })

    const agentResults = await Promise.all(agentPromises)

    const totalSaved = agentResults.reduce((s: number, r: any) => s + r.productsFound, 0)
    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
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
