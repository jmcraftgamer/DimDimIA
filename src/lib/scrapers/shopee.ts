import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'

export async function scrapeShopee(query: string): Promise<ScrapedProduct[]> {
  try {
    const url = `https://shopee.com.br/search?keyword=${encodeURIComponent(query)}`
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
        'Referer': 'https://www.shopee.com.br/',
      },
      timeout: 15000,
    })

    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []

    let productData: any[] = []
    
    $('script').each((_, el) => {
      const text = $(el).html() || ''
      
      const stateMatch = text.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/)
      if (stateMatch) {
        try {
          const state = JSON.parse(stateMatch[1])
          if (state?.search?.result?.items) {
            productData = state.search.result.items
          }
        } catch (e) {}
      }

      const nextMatch = text.match(/window\.__NEXT_DATA__\s*=\s*({.+?});/)
      if (nextMatch) {
        try {
          const nextData = JSON.parse(nextMatch[1])
          if (nextData?.props?.pageProps?.products) {
            productData = nextData.props.pageProps.products
          }
        } catch (e) {}
      }
    })

    $('script[type="application/ld+json"]').each((_, el) => {
      const text = $(el).html() || ''
      try {
        const json = JSON.parse(text)
        if (json['@type'] === 'ItemList' && json.itemListElement) {
          productData = json.itemListElement.map((item: any) => ({
            name: item.name,
            price: item.offers?.price || 0,
            image: item.image,
            url: item.url,
          }))
        }
      } catch (e) {}
    })

    for (const item of productData) {
      const name = item.name || item.title || ''
      const price = (item.price || item.price_max || 0) / 100000 || item.price || 0
      const oldPrice = item.price_before_discount ? item.price_before_discount / 100000 : undefined
      const image = item.image || item.images?.[0] || ''
      const shopId = item.shopid || item.shop_id || ''
      const itemId = item.itemid || item.item_id || ''
      const productUrl = `https://shopee.com.br/product/-i.${shopId}.${itemId}`

      if (name && price > 0) {
        products.push({
          name,
          description: name,
          price,
          oldPrice,
          store: 'Shopee',
          imageUrl: image || 'https://via.placeholder.com/200',
          productUrl,
          rating: item.rating_star || item.item_rating?.rating_star || undefined,
          totalSales: item.historical_sold || item.sold || undefined,
          freeShipping: item.is_free_shipping || false,
        })
      }
    }

    return products.slice(0, 15)
  } catch (error) {
    console.error('Shopee scrape error:', error)
    return []
  }
}
