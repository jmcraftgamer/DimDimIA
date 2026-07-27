import { NextResponse } from 'next/server'
import axios from 'axios'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data } = await axios.get('https://api.mercadolibre.com/sites/MLB/search', {
      params: { category: 'MLB1051', offset: 0, limit: 5 },
      timeout: 10000,
    })

    const items = data.results?.slice(0, 5).map((r: any) => ({
      title: r.title,
      price: r.price,
      original_price: r.original_price,
      sale_price: r.sale_price,
      available: r.available_quantity,
    }))

    return NextResponse.json({
      total: data.paging?.total,
      results: data.results?.length,
      items,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
