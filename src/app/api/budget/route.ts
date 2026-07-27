import { NextResponse } from 'next/server'
import { getApifyUsageReport } from '../../../lib/apify'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await getApifyUsageReport()
    return NextResponse.json(report)
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
