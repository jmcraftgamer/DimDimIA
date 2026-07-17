import axios from 'axios'
import { ScrapedProduct } from '../../types'

export async function scrapeShopee(query: string): Promise<ScrapedProduct[]> {
  try {
    const url = `https://shopee.com.br/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=10&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://shopee.com.br/',
      },
      timeout: 15000,
    })

    const products: ScrapedProduct[] = []
    const items = data?.items || []

    for (const item of items) {
      const product = item?.item_basic || item
      if (!product) continue

      const name = product.name || product.title || ''
      const price = (product.price || 0) / 100000
      const oldPrice = product.price_before_discount ? product.price_before_discount / 100000 : undefined
      const imageId = product.image || ''
      const shopId = product.shopid || ''
      const itemId = product.itemid || product.item_id || ''
      const imageUrl = imageId ? `https://down-br.img.susercontent.com/file/${imageId}` : ''
      const productUrl = `https://shopee.com.br/${name ? encodeURIComponent(name.substring(0, 40)) : 'product'}-i.${shopId}.${itemId}`
      const salesText = product.historical_sold || product.sold || 0
      const rating = product.item_rating?.rating_star || product.rating_star

      if (name && price > 0) {
        products.push({
          name,
          description: name,
          price,
          oldPrice,
          store: 'Shopee',
          imageUrl: imageUrl || 'https://via.placeholder.com/200',
          productUrl,
          rating: rating || undefined,
          totalSales: salesText || undefined,
          freeShipping: product.is_free_shipping || false,
        })
      }
    }

    return products.slice(0, 10)
  } catch (error) {
    console.error('Shopee scrape error:', error)
    return []
  }
}
