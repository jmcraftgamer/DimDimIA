import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'
import { runApifyActor, APIFY_ACTORS } from '../apify'

const CHROME_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Dnt': '1',
  'Referer': 'https://www.amazon.com.br/',
}

function parseAmazonProducts(html: string): ScrapedProduct[] {
  const $ = cheerio.load(html)
  const products: ScrapedProduct[] = []

  $('[data-component-type="s-search-result"]').each((_, el) => {
    const $el = $(el)
    const name = $el.find('h2 a span').first().text().trim()
    const priceWhole = $el.find('.a-price-whole').first().text().trim()
    const priceFraction = $el.find('.a-price-fraction').first().text().trim()
    const imageUrl = $el.find('img.s-image').attr('src') || ''
    const productUrl = $el.find('h2 a').attr('href') || ''
    const ratingText = $el.find('.a-icon-alt').first().text().trim()
    const couponText = $el.find('.s-coupon-highlight, [class*="coupon"]').text().trim()
    const salesText = $el.find('.a-size-base').filter((_, el) => $(el).text().includes('vendidos')).text().trim()

    const priceStr = priceWhole.replace(/\./g, '').replace(',', '.') + (priceFraction ? '.' + priceFraction : '')
    const price = parseFloat(priceStr) || 0

    if (name && price > 0) {
      const fullUrl = productUrl.startsWith('http') ? productUrl : `https://www.amazon.com.br${productUrl}`
      products.push({
        name,
        description: name,
        price,
        store: 'Amazon',
        imageUrl: imageUrl || 'https://via.placeholder.com/200',
        productUrl: fullUrl,
        rating: ratingText ? parseFloat(ratingText.split(' ')[0].replace(',', '.')) : undefined,
        coupon: couponText || undefined,
        totalSales: salesText ? parseInt(salesText.replace(/\D/g, '')) || undefined : undefined,
      })
    }
  })

  return products.slice(0, 15)
}

function mapApifyAmazon(items: any[]): ScrapedProduct[] {
  return items.slice(0, 15).map((item: any) => ({
    name: item.title || item.name || '',
    description: item.title || item.name || '',
    price: item.price || item.currentPrice || 0,
    oldPrice: item.originalPrice || undefined,
    store: 'Amazon',
    imageUrl: item.image || item.imageUrl || 'https://via.placeholder.com/200',
    productUrl: item.url || item.link || item.productUrl || '',
    rating: item.rating || undefined,
    totalSales: item.salesCount || item.reviewCount || undefined,
  })).filter((p) => p.name && p.price > 0)
}

export async function scrapeAmazon(query: string): Promise<ScrapedProduct[]> {
  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 1000 * attempt))
      }

      const url = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`
      const { data } = await axios.get(url, {
        headers: CHROME_HEADERS,
        timeout: 15000,
        decompress: true,
      })

      if (data.length < 5000) continue

      const html = typeof data === 'string' ? data : data.toString('utf-8')
      const products = parseAmazonProducts(html)
      if (products.length > 0) return products
    } catch (error) {
      console.error(`Amazon scrape error (tentativa ${attempt + 1}):`, error)
    }
  }

  const actor = APIFY_ACTORS.amazon
  const apifyItems = await runApifyActor('Amazon', actor.actorId, query, actor.inputMapper, actor.costPerProduct)
  if (apifyItems.length > 0) return mapApifyAmazon(apifyItems)

  return []
}
