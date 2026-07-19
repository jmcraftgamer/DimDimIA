import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'

export async function scrapeKabum(query: string): Promise<ScrapedProduct[]> {
  try {
    const url = `https://www.kabum.com.br/busca/${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.google.com/',
      },
      timeout: 15000,
    })

    const $ = cheerio.load(data)
    const nextData = $('#__NEXT_DATA__').html()
    if (!nextData) return []

    const json = JSON.parse(nextData)
    const products: ScrapedProduct[] = json.props?.pageProps?.data?.catalogServer?.data || []

    return products.slice(0, 15).map((p: any) => ({
      name: p.name || '',
      description: p.description ? cheerio.load(p.description).text().trim().substring(0, 200) : p.name || '',
      price: p.priceWithDiscount || p.price || 0,
      oldPrice: p.oldPrice && p.oldPrice !== p.price ? p.oldPrice : undefined,
      store: 'Kabum',
      imageUrl: p.image || p.thumbnail || 'https://via.placeholder.com/200',
      productUrl: `https://www.kabum.com.br/produto/${p.code}`,
      rating: p.averageRating || undefined,
      totalSales: p.ratingCount || undefined,
      freeShipping: p.flags?.isFreeShipping || false,
    })).filter((p: ScrapedProduct) => p.name && p.price > 0)
  } catch (error) {
    console.error('Kabum scrape error:', error)
    return []
  }
}
