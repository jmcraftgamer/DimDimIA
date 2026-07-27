import { NextResponse } from 'next/server'
import axios from 'axios'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data } = await axios.get('https://api.mercadolibre.com/sites/MLB/search', {
      params: { category: 'MLB1051', offset: 0, limit: 5 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
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
    return NextResponse.json({ error: err.message, status: err?.response?.status, data: err?.response?.data })
  }
}
