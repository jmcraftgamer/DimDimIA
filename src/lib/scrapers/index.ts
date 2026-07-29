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

export async function scrapeOneStore(query: string, storeIndex: number, skipApify?: boolean): Promise<ScrapedProduct[]> {
  const store = ALL_STORES[storeIndex]
  if (!store) return []
  try {
    const scraper = store.scraper as any
    const products = scraper.length >= 2 ? await scraper(query, skipApify) : await scraper(query)
    return products.map((p: ScrapedProduct) => ({ ...p, store: store.name }))
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

const QUERY_EXPANSIONS: Record<string, string[]> = {
  pcs: ['pc', 'computador', 'pc gamer', 'computador completo'],
  pc: ['computador', 'pc gamer', 'desktop'],
}

export async function searchProducts(query: string): Promise<ScrapedProduct[]> {
  const queries = [query]

  const lower = query.toLowerCase().trim()
  if (QUERY_EXPANSIONS[lower]) {
    queries.push(...QUERY_EXPANSIONS[lower])
  } else {
    const words = query.split(' ').filter(w => w.length >= 2)
    if (words.length > 1) {
      queries.push(words.join(' '))
    }
  }

  const allProducts: ScrapedProduct[] = []
  const seen = new Set<string>()

  for (const q of queries) {
    const results = await scrapeAllStores(q)
    for (const result of results) {
      if (result.products.length > 0) {
        for (const p of result.products) {
          const key = p.productUrl || p.name
          if (!seen.has(key)) {
            seen.add(key)
            allProducts.push({ ...p, store: result.store })
          }
        }
      }
    }
  }

  allProducts.sort((a, b) => a.price - b.price)
  return allProducts.slice(0, 500)
}
