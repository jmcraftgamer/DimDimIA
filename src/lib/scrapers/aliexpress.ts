import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'

export async function scrapeAliExpress(query: string): Promise<ScrapedProduct[]> {
  try {
    const url = `https://pt.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}&pageSize=60`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.aliexpress.com/',
      },
      timeout: 25000,
    })

    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []
    const seen = new Set<string>()

    const processCard = (card: cheerio.Cheerio<any>) => {
      const allText = card.text().trim()
      const img = card.find('img').first()
      const name = img.attr('alt') || ''

      if (!name || name.length < 5 || seen.has(name)) return
      seen.add(name)

      const priceMatch = allText.match(/R\$\s*([\d.,]+)/)
      if (!priceMatch) return

      const priceStr = priceMatch[1].replace(/\./g, '').replace(',', '.')
      const price = parseFloat(priceStr) || 0
      if (price <= 0) return

      const imageUrl = img.attr('src') || img.attr('data-src') || ''

      let productUrl = card.closest('a').attr('href') || card.find('a').first().attr('href') || ''
      if (productUrl && !productUrl.startsWith('http')) {
        productUrl = `https://pt.aliexpress.com${productUrl}`
      }

      const normalizedImg = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl

      const oldPriceMatch = allText.match(/R\$\s*([\d.,]+)\s*[,-]\s*\d+%/) || allText.match(/de:\s*R\$\s*([\d.,]+)/i)
      const oldPrice = oldPriceMatch
        ? parseFloat(oldPriceMatch[1].replace(/\./g, '').replace(',', '.'))
        : undefined

      const hasCoupon = allText.includes('cupom') || allText.includes('CUPOM') || allText.includes('OFF')

      products.push({
        name,
        description: name,
        price,
        oldPrice: oldPrice !== price ? oldPrice : undefined,
        store: 'AliExpress',
        imageUrl: normalizedImg || 'https://via.placeholder.com/200',
        productUrl: productUrl || url,
        freeShipping: allText.includes('Frete grátis') || allText.includes('Free Shipping'),
        coupon: hasCoupon ? 'CUPOM' : undefined,
      })
    }

    $('.search-item-card-wrapper-gallery, .search-card-item, [class*="product"][class*="card"], [class*="item"][class*="card"]').each((_, el) => {
      processCard($(el))
    })

    $('a[class*="card"]').each((_, el) => {
      const $el = $(el)
      if ($el.find('img[alt]').length) processCard($el)
    })

    return products
  } catch (error) {
    console.error('AliExpress scrape error:', error)
    return []
  }
}
