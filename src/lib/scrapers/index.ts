import { ScrapedProduct } from '../../types'
import { scrapeMercadoLivre } from './mercadolivre'
import { scrapeAmazon } from './amazon'
import { scrapeShopee } from './shopee'
import { scrapeAliExpress } from './aliexpress'
import { scrapeKabum } from './kabum'
import { scrapePichau } from './pichau'
import { scrapeTerabyteShop } from './terabyteshop'

export interface ScraperResult {
  store: string
  products: ScrapedProduct[]
  error?: string
}

export const ALL_STORES = [
  { name: 'Mercado Livre', scraper: scrapeMercadoLivre },
  { name: 'Amazon', scraper: scrapeAmazon },
  { name: 'Shopee', scraper: scrapeShopee },
  { name: 'AliExpress', scraper: scrapeAliExpress },
  { name: 'Kabum', scraper: scrapeKabum },
  { name: 'Pichau', scraper: scrapePichau },
  { name: 'TerabyteShop', scraper: scrapeTerabyteShop },
] as const

export async function scrapeOneStore(query: string, storeIndex: number): Promise<ScrapedProduct[]> {
  const store = ALL_STORES[storeIndex]
  if (!store) return []
  try {
    const products = await store.scraper(query)
    return products.map((p) => ({ ...p, store: store.name }))
  } catch (err) {
    console.error(`[Scraper] Erro em ${store?.name}:`, err)
    return []
  }
}

export async function scrapeAllStores(query: string): Promise<ScraperResult[]> {
  const scrapers = [
    { name: 'Mercado Livre', fn: () => scrapeMercadoLivre(query) },
    { name: 'Amazon', fn: () => scrapeAmazon(query) },
    { name: 'Shopee', fn: () => scrapeShopee(query) },
    { name: 'AliExpress', fn: () => scrapeAliExpress(query) },
    { name: 'Kabum', fn: () => scrapeKabum(query) },
    { name: 'Pichau', fn: () => scrapePichau(query) },
    { name: 'TerabyteShop', fn: () => scrapeTerabyteShop(query) },
  ]

  const results = await Promise.allSettled(
    scrapers.map(async (s) => {
      try {
        const products = await s.fn()
        return { store: s.name, products } as ScraperResult
      } catch (err) {
        return { store: s.name, products: [], error: `Falha ao buscar em ${s.name}` } as ScraperResult
      }
    })
  )

  return results.map((r) =>
    r.status === 'fulfilled' ? r.value : { store: 'Unknown', products: [], error: 'Scraper failed' }
  )
}

export async function scrapeSpecificStore(store: string, query: string): Promise<ScrapedProduct[]> {
  const scrapers: Record<string, (q: string) => Promise<ScrapedProduct[]>> = {
    'Mercado Livre': scrapeMercadoLivre,
    'Amazon': scrapeAmazon,
    'Shopee': scrapeShopee,
    'AliExpress': scrapeAliExpress,
    'Kabum': scrapeKabum,
    'Pichau': scrapePichau,
    'TerabyteShop': scrapeTerabyteShop,
  }

  const scraper = scrapers[store]
  if (!scraper) throw new Error(`Loja ${store} não suportada`)

  return scraper(query)
}

export async function searchProducts(query: string): Promise<ScrapedProduct[]> {
  const results = await scrapeAllStores(query)
  const allProducts: ScrapedProduct[] = []

  for (const result of results) {
    if (result.products.length > 0) {
      const withStore = result.products.map((p) => ({
        ...p,
        store: result.store,
      }))
      allProducts.push(...withStore)
    }
  }

  allProducts.sort((a, b) => a.price - b.price)
  return allProducts.slice(0, 50)
}
