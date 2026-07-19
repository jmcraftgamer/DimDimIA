import { NextResponse } from 'next/server'
import { getApifyUsageReport } from '../../../lib/apify'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await getApifyUsageReport()
    const apiKeyConfigured = !!process.env.APIFY_API_KEY

    let message: string
    if (!apiKeyConfigured) {
      message = 'API key do Apify não configurada. Adicione APIFY_API_KEY no .env'
    } else if (report.percentageUsed >= 100) {
      message = 'Limite mensal atingido. Os scrapers via Apify serão desativados até o próximo mês.'
    } else {
      message = `Você usou ${report.percentageUsed}% do orçamento mensal.`
    }

    return NextResponse.json({
      success: true,
      ...report,
      apiKeyConfigured,
      message,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}
