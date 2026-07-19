import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'
import { runApifyActor, APIFY_ACTORS } from '../apify'

function mapApifyTerabyte(items: any[]): ScrapedProduct[] {
  return items.slice(0, 15).map((item: any) => ({
    name: item.title || item.name || item.product_name || '',
    description: item.title || item.name || item.product_name || '',
    price: item.price || item.currentPrice || item.salePrice || 0,
    oldPrice: item.originalPrice || item.oldPrice || undefined,
    store: 'TerabyteShop',
    imageUrl: item.image || item.imageUrl || item.thumbnail || 'https://via.placeholder.com/200',
    productUrl: item.url || item.link || item.productUrl || '',
    rating: item.rating || undefined,
    totalSales: item.sales || item.totalSales || undefined,
  })).filter((p) => p.name && p.price > 0)
}

export async function scrapeTerabyteShop(query: string): Promise<ScrapedProduct[]> {
  const actor = APIFY_ACTORS.terabyteshop
  const apifyItems = await runApifyActor('TerabyteShop', actor.actorId, query, actor.inputMapper, actor.costPerProduct)
  if (apifyItems.length > 0) return mapApifyTerabyte(apifyItems)

  try {
    const url = `https://www.terabyteshop.com.br/busca?q=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 10000,
      validateStatus: (status) => status < 400,
    })

    if (data.length < 1000) return []

    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []

    $('[class*="product"], .product-box, [class*="item"]').each((_, el) => {
      const $el = $(el)
      const name = $el.find('[class*="title"], [class*="name"], h2, [class*="Title"]').first().text().trim()
      const priceText = $el.find('[class*="price"], [class*="Price"], [class*="preco"]').first().text().trim()
      const imageUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src') || ''
      const link = $el.closest('a').attr('href') || $el.find('a').first().attr('href') || ''

      const priceMatch = priceText.match(/[\d.,]+/)
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/\./g, '').replace(',', '.')) : 0

      if (name && price > 0) {
        products.push({
          name,
          description: name,
          price,
          store: 'TerabyteShop',
          imageUrl: imageUrl || 'https://via.placeholder.com/200',
          productUrl: link.startsWith('http') ? link : `https://www.terabyteshop.com.br${link}`,
        })
      }
    })

    return products.slice(0, 15)
  } catch (error: any) {
    if (error?.response?.status === 403 || error?.response?.status === 503) {
      return []
    }
    console.error('TerabyteShop scrape error:', error?.message || error)
    return []
  }
}
