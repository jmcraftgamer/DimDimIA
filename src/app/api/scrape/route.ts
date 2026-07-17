import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllStores, scrapeSpecificStore, searchProducts } from '../../../lib/scrapers'
import { chatWithModel, MODELS, SYSTEM_PROMPTS } from '../../../lib/openhauter'

export async function POST(request: NextRequest) {
  try {
    const { query, store } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query é obrigatória' }, { status: 400 })
    }

    let products
    if (store) {
      products = await scrapeSpecificStore(store, query)
    } else {
      products = await searchProducts(query)
    }

    const topProducts = products.slice(0, 5)

    const aiAnalysis = await chatWithModel(
      MODELS.PRODUCT_SEARCH,
      [{ role: 'user', content: `Analise estes produtos e retorne os top 5 com recomendação: ${JSON.stringify(topProducts)}` }],
      SYSTEM_PROMPTS.PRODUCT_SEARCH
    )

    return NextResponse.json({
      products: topProducts,
      aiAnalysis,
      totalFound: products.length,
    })
  } catch (error: any) {
    console.error('Scrape API error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
