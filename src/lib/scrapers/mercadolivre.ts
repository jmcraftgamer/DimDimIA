import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'
import { scrapeMLByCategory } from './mercadolivre-api'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
}

function parseBRL(text: string): number {
  const cleaned = text.replace(/[R$\s\.]/g, '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function parseSearchCard($el: cheerio.Cheerio<any>): ScrapedProduct | null {
  const link = $el.find('.poly-component__title-wrapper a').first().attr('href')
  if (!link) return null

  const name = $el.find('.poly-component__title').first().text().trim()
  if (!name) return null

  const img = $el.find('.poly-component__picture').first().attr('src')
    || $el.find('img').first().attr('data-src')
    || $el.find('img').first().attr('src') || ''

  const oldPriceEl = $el.find('s.andes-money-amount--previous .andes-money-amount__fraction').first()
  const oldPriceCents = $el.find('s.andes-money-amount--previous .andes-money-amount__cents').first()
  const oldPriceText = oldPriceEl.text().trim()

  const newPriceEl = $el.find('.poly-price__amount .andes-money-amount__fraction').first()
  const newPriceCents = $el.find('.poly-price__amount .andes-money-amount__cents').first()
  const newPriceText = newPriceEl.text().trim()
  const newPriceCentsText = newPriceCents.text().trim()

  const price = parseBRL(newPriceText + (newPriceCentsText ? ',' + newPriceCentsText : ''))
  let oldPrice = oldPriceText ? parseBRL(oldPriceText) : 0

  if (!oldPrice || oldPrice <= price) {
    const discountText = $el.find('.polylabel-pill').first().text().trim()
    const pct = parseInt(discountText.replace(/\D/g, ''))
    if (pct > 0 && pct < 100 && price > 0) {
      oldPrice = Math.round(price / (1 - pct / 100))
    }
  }

  if (!price) return null

  const seller = $el.find('.poly-component__seller').first().text().trim()
  const freeShipping = $el.text().toLowerCase().includes('frete grátis') || $el.text().toLowerCase().includes('frete gratis')

  const ratingEl = $el.find('.andes-reviews__rating').first().text().trim()
  const rating = ratingEl ? parseFloat(ratingEl.replace(',', '.')) : undefined

  const salesEl = $el.find('.poly-actions__sales').first().text().trim()
  const salesMatch = salesEl.match(/([\d.]+)/)
  const totalSales = salesMatch ? parseInt(salesMatch[1].replace(/\./g, '')) : undefined

  return {
    name,
    description: name,
    price,
    oldPrice: oldPrice > price ? oldPrice : undefined,
    store: 'Mercado Livre',
    imageUrl: img.startsWith('http') ? img : `https:${img}`,
    productUrl: link.startsWith('http') ? link : `https://www.mercadolivre.com.br${link}`,
    freeShipping,
    sellerName: seller,
    rating,
    totalSales,
    inStock: true,
  }
}

async function scrapeMLApiByQuery(query: string): Promise<ScrapedProduct[]> {
  try {
    const { data } = await axios.get('https://api.mercadolibre.com/sites/MLB/search', {
      params: { q: query, limit: 50 },
      timeout: 10000,
    })
    if (!data?.results?.length) return []

    return data.results.map((item: any) => ({
      name: item.title,
      description: item.title,
      price: item.price,
      oldPrice: item.original_price || 0,
      store: 'Mercado Livre',
      imageUrl: item.thumbnail?.replace(/-I\.jpg/, '-O.jpg') ?? '',
      productUrl: item.permalink ?? '',
      freeShipping: item.shipping?.free_shipping ?? false,
      sellerName: item.seller?.nickname ?? '',
      rating: item.reviews?.average ?? null,
      totalSales: item.sold_quantity ?? null,
      inStock: true,
    }))
  } catch {
    return []
  }
}

export async function scrapeMercadoLivre(query: string, skipApify?: boolean): Promise<ScrapedProduct[]> {
  if (!query || query.trim() === '') {
    return scrapeMLByCategory('geral')
  }

  const apiProducts = await scrapeMLApiByQuery(query)
  if (apiProducts.length >= 5) return apiProducts

  const products: ScrapedProduct[] = []
  const seen = new Set<string>()
  const searchQuery = encodeURIComponent(query.trim().toLowerCase().replace(/\s+/g, '-'))

  const urls = [
    `https://lista.mercadolivre.com.br/${searchQuery}`,
    `https://lista.mercadolivre.com.br/${searchQuery}_Desde_49`,
    `https://lista.mercadolivre.com.br/${searchQuery}_Desde_97`,
  ]

  for (const url of urls) {
    try {
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 })
      const $ = cheerio.load(data)

      let count = 0
      $('.poly-card, .ui-search-result').each((_, el) => {
        const p = parseSearchCard($(el))
        if (p && !seen.has(p.productUrl)) {
          seen.add(p.productUrl)
          products.push(p)
          count++
        }
      })

      if (count === 0) break
    } catch {
      break
    }
  }

  if (products.length === 0) {
    return scrapeMLByCategory('geral')
  }

  return products
}
