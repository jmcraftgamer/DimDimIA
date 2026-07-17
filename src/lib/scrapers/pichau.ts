import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'

export async function scrapePichau(query: string): Promise<ScrapedProduct[]> {
  try {
    const url = `https://www.pichau.com.br/search?q=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
    })

    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []

    $('[class*="product"], [class*="item"]').each((_, el) => {
      const $el = $(el)
      const name = $el.find('[class*="title"], [class*="name"], h2').first().text().trim()
      const priceText = $el.find('[class*="price"], [class*="Price"]').first().text().trim()
      const imageUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src') || ''
      const link = $el.closest('a').attr('href') || ''

      const priceMatch = priceText.match(/[\d.,]+/)
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/\./g, '').replace(',', '.')) : 0

      if (name && price > 0) {
        products.push({
          name,
          description: name,
          price,
          store: 'Pichau',
          imageUrl: imageUrl || 'https://via.placeholder.com/200',
          productUrl: link.startsWith('http') ? link : `https://www.pichau.com.br${link}`,
        })
      }
    })

    return products.slice(0, 10)
  } catch (error) {
    console.error('Pichau scrape error:', error)
    return []
  }
}
