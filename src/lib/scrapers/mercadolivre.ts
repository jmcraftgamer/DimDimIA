import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'

export async function scrapeMercadoLivre(query: string): Promise<ScrapedProduct[]> {
  try {
    const url = `https://www.mercadolivre.com.br/search?q=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
    })

    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []

    $('.ui-search-layout__item').each((_, el) => {
      const $el = $(el)
      const name = $el.find('.ui-search-item__title').text().trim()
      const priceText = $el.find('.andes-money-amount__fraction').first().text().trim()
      const oldPriceText = $el.find('.andes-money-amount--previous .andes-money-amount__fraction').text().trim()
      const imageUrl = $el.find('img').attr('data-src') || $el.find('img').attr('src') || ''
      const productUrl = $el.find('a.ui-search-link').attr('href') || ''
      const ratingText = $el.find('.ui-search-reviews__rating-number').text().trim()
      const salesText = $el.find('.ui-search-reviews__amount').text().trim()
      const freeShipping = $el.find('.ui-search-item__shipping').text().toLowerCase().includes('grátis')

      const price = parseFloat(priceText.replace(/\./g, '').replace(',', '.')) || 0
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

    return products.slice(0, 10)
  } catch (error) {
    console.error('Mercado Livre scrape error:', error)
    return []
  }
}
