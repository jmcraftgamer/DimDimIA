import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'

export async function scrapeAliExpress(query: string): Promise<ScrapedProduct[]> {
  try {
    const url = `https://pt.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.aliexpress.com/',
      },
      timeout: 20000,
    })

    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []

    const cards = $('.search-item-card-wrapper-gallery, .search-card-item')

    if (cards.length === 0) return []

    cards.each((_, el) => {
      const card = $(el)
      const allText = card.text().trim()

      const img = card.find('img').first()
      const name = img.attr('alt') || ''

      const priceMatch = allText.match(/R\$\s*([\d.,]+)/)
      if (!priceMatch) return

      const priceStr = priceMatch[1].replace(/\./g, '').replace(',', '.')
      const price = parseFloat(priceStr) || 0

      const imageUrl = img.attr('src') || ''

      let productUrl = ''
      const parentAnchor = card.closest('a')
      if (parentAnchor.length) {
        productUrl = parentAnchor.attr('href') || ''
      }
      if (!productUrl) {
        const firstAnchor = card.find('a').first()
        productUrl = firstAnchor.attr('href') || ''
      }

      if (productUrl && !productUrl.startsWith('http')) {
        productUrl = `https://pt.aliexpress.com${productUrl}`
      }

      const normalizedImg = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl

      if (name && price > 0) {
        products.push({
          name,
          description: name,
          price,
          store: 'AliExpress',
          imageUrl: normalizedImg || 'https://via.placeholder.com/200',
          productUrl: productUrl || `https://pt.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,
        })
      }
    })

    return products.slice(0, 15)
  } catch (error) {
    console.error('AliExpress scrape error:', error)
    return []
  }
}
