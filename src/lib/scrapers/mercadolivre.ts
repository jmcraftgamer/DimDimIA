import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'
import { runApifyActor, APIFY_ACTORS } from '../apify'

function mapApifyML(items: any[]): ScrapedProduct[] {
  return items.slice(0, 15).map((item: any) => ({
    name: item.title || item.name || '',
    description: item.title || item.name || '',
    price: item.price || 0,
    oldPrice: item.original_price || item.originalPrice || undefined,
    store: 'Mercado Livre',
    imageUrl: item.thumbnail || item.image || item.imageUrl || 'https://via.placeholder.com/200',
    productUrl: item.url || item.link || item.productUrl || '',
    rating: item.average_rating || item.rating || item.rating_average || undefined,
    totalSales: item.sales || item.totalSales || item.soldQuantity || item.reviews_count || undefined,
    freeShipping: item.shipping?.free_shipping || item.free_shipping || item.freeShipping || false,
  })).filter((p) => p.name && p.price > 0)
}

export async function scrapeMercadoLivre(query: string, skipApify?: boolean): Promise<ScrapedProduct[]> {
  try {
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
      },
      timeout: 15000,
    })

    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []

    $('.ui-search-layout__item, .andes-card, [class*="item-card"]').each((_, el) => {
      const $el = $(el)
      const name = $el.find('.ui-search-item__title, [class*="title"], h2').first().text().trim()
      const priceText = $el.find('.andes-money-amount__fraction').first().text().trim()
      const oldPriceText = $el.find('.andes-money-amount--previous .andes-money-amount__fraction').text().trim()
      const imageUrl = $el.find('img').attr('data-src') || $el.find('img').attr('src') || ''
      const productUrl = $el.find('a[href*="MLB"]').attr('href') || $el.find('a').first().attr('href') || ''
      const ratingText = $el.find('.ui-search-reviews__rating-number').text().trim()
      const salesText = $el.find('.ui-search-reviews__amount').text().trim()
      const freeShipping = $el.find('.ui-search-item__shipping, [class*="shipping"]').text().toLowerCase().includes('grátis')

      const price = priceText ? parseFloat(priceText.replace(/\./g, '').replace(',', '.')) : 0
      const oldPrice = oldPriceText ? parseFloat(oldPriceText.replace(/\./g, '').replace(',', '.')) : undefined

      if (name && price > 0) {
        products.push({
          name,
          description: name,
          price,
          oldPrice,
          store: 'Mercado Livre',
          imageUrl: imageUrl || 'https://via.placeholder.com/200',
          productUrl: productUrl.startsWith('http') ? productUrl : `https://www.mercadolivre.com.br${productUrl}`,
          rating: ratingText ? parseFloat(ratingText.replace(',', '.')) : undefined,
          totalSales: salesText ? parseInt(salesText.replace(/\D/g, '')) || undefined : undefined,
          freeShipping,
        })
      }
    })

    return products.slice(0, 15)
  } catch (error) {
    console.error('Mercado Livre scrape error:', error)
  }

  const actor = APIFY_ACTORS.mercadolivre
  const apifyItems = await runApifyActor('Mercado Livre', actor.actorId, query, actor.inputMapper, actor.costPerProduct)
  if (apifyItems.length > 0) return mapApifyML(apifyItems)

  return []
}
