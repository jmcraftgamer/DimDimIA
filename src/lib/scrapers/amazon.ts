import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'

export async function scrapeAmazon(query: string): Promise<ScrapedProduct[]> {
  try {
    const url = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
    })

    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []

    $('[data-component-type="s-search-result"]').each((_, el) => {
      const $el = $(el)
      const name = $el.find('h2 a span').first().text().trim()
      const priceWhole = $el.find('.a-price-whole').first().text().trim()
      const priceFraction = $el.find('.a-price-fraction').first().text().trim()
      const imageUrl = $el.find('img.s-image').attr('src') || ''
      const productUrl = $el.find('h2 a').attr('href') || ''
      const ratingText = $el.find('.a-icon-star-small .a-icon-alt').text().trim()
      const couponText = $el.find('.s-coupon-highlight').text().trim()

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
        })
      }
    })

    return products.slice(0, 10)
  } catch (error) {
    console.error('Amazon scrape error:', error)
    return []
  }
}
