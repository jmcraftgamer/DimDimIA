import axios from 'axios'
import { ScrapedProduct } from '../../types'

function parsePrice(price: number): number {
  return price / 100000
}

function buildImageUrl(imageId: string): string {
  if (!imageId) return 'https://via.placeholder.com/200'
  if (imageId.startsWith('http')) return imageId
  return `https://cf.shopee.com.br/file/${imageId}`
}

function buildProductUrl(shopId: number | string, itemId: number | string): string {
  return `https://shopee.com.br/product/-.${shopId}.${itemId}`
}

export async function scrapeShopee(query: string): Promise<ScrapedProduct[]> {
  try {
    const url = `https://shopee.com.br/api/v4/search/search_items`
    const { data } = await axios.get(url, {
      params: {
        by: 'relevancy',
        keyword: query,
        limit: 15,
        newest: 0,
        order: 'desc',
        page_type: 'search',
        version: 2,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'x-requested-with': 'XMLHttpRequest',
        'referer': `https://shopee.com.br/search?keyword=${encodeURIComponent(query)}`,
        'origin': 'https://shopee.com.br',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
      },
      timeout: 15000,
    })

    if (data.error !== 0 || !data.data?.items) {
      console.error('Shopee API error:', data.error, data.error_msg)
      return []
    }

    const items = data.data.items
    const products: ScrapedProduct[] = []

    for (const item of items) {
      const basic = item.item_basic || item
      const name = basic.name || ''
      const price = parsePrice(basic.price || 0)
      const originalPrice = basic.original_price ? parsePrice(basic.original_price) : undefined
      const imageId = basic.image || (basic.images && basic.images[0]) || ''
      const shopId = basic.shopid || ''
      const itemId = basic.itemid || ''
      const rating = basic.item_rating?.rating_star || item.item_rating?.rating_star || undefined
      const sold = item.sold || item.historical_sold || basic.historical_sold || undefined

      const oldPrice = originalPrice && originalPrice > price ? originalPrice : undefined

      if (name && price > 0) {
        products.push({
          name,
          description: name,
          price,
          oldPrice,
          store: 'Shopee',
          imageUrl: buildImageUrl(imageId),
          productUrl: buildProductUrl(shopId, itemId),
          rating: rating ? parseFloat(rating) : undefined,
          totalSales: sold || undefined,
          freeShipping: basic.is_free_shipping || basic.is_on_flash_sale || false,
        })
      }
    }

    return products.slice(0, 15)
  } catch (error) {
    console.error('Shopee scrape error:', error)
    return []
  }
}
