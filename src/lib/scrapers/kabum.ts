import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'

const CATEGORY_URLS: Record<string, string> = {
  geladeiras: 'geladeiras',
  'geladeira frost free': 'geladeiras',
  'geladeira inverse': 'geladeiras',
  refrigerador: 'geladeiras',
  fogao: 'fogao',
  'fogao 4 bocas': 'fogao',
  'fogao cooktop': 'cooktop',
  microondas: 'micro-ondas',
  'lavadora de roupas': 'maquina-de-lavar',
  'maquina de lavar': 'maquina-de-lavar',
  'lava e seca': 'lava-e-seca',
  secadora: 'secadora-de-roupas',
  aspirador: 'aspirador-de-po',
  'aspirador de po': 'aspirador-de-po',
  'aspirador robo': 'aspirador-de-po',
  cafeteira: 'cafeteira',
  liquidificador: 'liquidificador',
  'air fryer': 'air-fryer',
  'fritadeira eletrica': 'air-fryer',
  ventilador: 'ventilador',
  freezer: 'freezer',
  notebook: 'notebook',
  laptop: 'notebook',
  tablet: 'tablet',
  smartwatch: 'smartwatch',
  'relogio inteligente': 'smartwatch',
  'tv 4k': 'tv',
  'smart tv': 'tv',
  soundbar: 'soundbar',
  'caixa de som': 'caixa-de-som',
  projetor: 'projetor',
  roteador: 'roteador',
  'roteador wifi': 'roteador',
  iphone: 'iphone',
  'samsung galaxy': 'celular-samsung',
  xiaomi: 'celular-xiaomi',
  motorola: 'celular-motorola',
  'fone de ouvido': 'fone-de-ouvido',
  headset: 'headset-gamer',
  'processador intel': 'processador-intel',
  'intel core i5': 'processador-intel',
  'intel core i7': 'processador-intel',
  'intel core i9': 'processador-intel',
  'processador amd': 'processador-amd',
  'amd ryzen 5': 'processador-amd',
  'amd ryzen 7': 'processador-amd',
  'amd ryzen 9': 'processador-amd',
  'placa de video': 'placa-de-video',
  'placa de video nvidia': 'placa-de-video-nvidia',
  'placa de video amd': 'placa-de-video-amd',
  ssd: 'ssd',
  'memoria ram': 'memoria-ram',
  monitor: 'monitor',
  monitor_4k: 'monitor',
  teclado: 'teclado',
  mouse: 'mouse',
  gabinete: 'gabinete',
  'fonte 750w': 'fonte',
  'placa mae': 'placa-mae',
  'water cooler': 'cooler',
  'hd externo': 'hd-externo',
  playstation: 'playstation',
  'ps5': 'playstation',
  xbox: 'xbox',
  nintendo: 'nintendo-switch',
  sofá: 'sofa',
  'sofa 3 lugares': 'sofa',
  cadeira: 'cadeira-escritorio',
  mesa: 'mesa',
  cama: 'cama-box',
  colchão: 'colchao',
  'tenis masculino': 'tenis-masculino',
  'tenis feminino': 'tenis-feminino',
  'tenis de corrida': 'tenis-corrida',
  mochila: 'mochila',
  perfume: 'perfume',
  whey: 'whey-protein',
  creatina: 'creatina',
  furadeira: 'furadeira',
  'kit ferramentas': 'kit-de-ferramentas',
  pneu: 'pneu',
  'bateria automotiva': 'bateria-automotiva',
  'som automotivo': 'som-automotivo',
  racao: 'racao',
  fralda: 'fralda',
  carrinho: 'carrinho-de-bebe',
  berco: 'berco',
  violao: 'violao',
  guitarra: 'guitarra',
  microfone: 'microfone',
}

function findCategoryUrl(query: string): string | null {
  const lower = query.toLowerCase()
  if (CATEGORY_URLS[lower]) return CATEGORY_URLS[lower]
  for (const [key, url] of Object.entries(CATEGORY_URLS)) {
    if (lower.includes(key)) return url
  }
  return null
}

function parsePage(html: string): ScrapedProduct[] {
  const $ = cheerio.load(html)
  const nextData = $('#__NEXT_DATA__').html()
  if (!nextData) return []

  const json = JSON.parse(nextData)
  const items = json.props?.pageProps?.data?.catalogServer?.data || []
  if (!items.length) return []

  return items.map((p: any) => ({
    name: p.name || '',
    description: p.description ? cheerio.load(p.description).text().trim().substring(0, 200) : p.name || '',
    price: p.priceWithDiscount || p.price || 0,
    oldPrice: p.oldPrice && p.oldPrice !== p.price ? p.oldPrice : undefined,
    store: 'Kabum',
    imageUrl: p.image || p.thumbnail || 'https://via.placeholder.com/200',
    productUrl: `https://www.kabum.com.br/produto/${p.code}`,
    rating: p.averageRating || undefined,
    totalSales: p.ratingCount || undefined,
    freeShipping: p.flags?.isFreeShipping || false,
    coupon: p.flags?.hasCoupon ? 'CUPOM' : undefined,
    inStock: p.available !== false && p.stock !== 0,
  })).filter((p: ScrapedProduct) => p.name && p.price > 0)
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Referer': 'https://www.google.com/',
}

export async function scrapeKabum(query: string): Promise<ScrapedProduct[]> {
  try {
    const catUrl = findCategoryUrl(query)

    if (catUrl) {
      const MAX_PAGES = 50
      const BATCH_SIZE = 6
      const allProducts: ScrapedProduct[] = []

      for (let batchStart = 1; batchStart <= MAX_PAGES; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, MAX_PAGES)
        const pages = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i)

        const results = await Promise.allSettled(
          pages.map(page => {
            const url = page === 1
              ? `https://www.kabum.com.br/${catUrl}`
              : `https://www.kabum.com.br/${catUrl}?page_number=${page}`
            return axios.get(url, { headers: HEADERS, timeout: 8000 }).then(res => parsePage(res.data))
          })
        )

        let anyData = false
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.length > 0) {
            allProducts.push(...result.value)
            anyData = true
          }
        }

        if (!anyData) break
      }

      return allProducts
    }

    // Search query - single page, limited results
    const url = `https://www.kabum.com.br/busca/${encodeURIComponent(query)}`
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 })
    const products = parsePage(data)
    return products.slice(0, 15)
  } catch (error) {
    console.error('Kabum scrape error:', error)
    return []
  }
}
