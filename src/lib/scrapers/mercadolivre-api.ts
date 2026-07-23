import { ScrapedProduct } from '../../types'

export interface MLBCategory {
  id: string
  name: string
  slug: string
}

export const MLB_CATEGORIES: MLBCategory[] = [
  { id: 'MLB1051', name: 'Celulares', slug: 'celulares' },
  { id: 'MLB1055', name: 'TVs', slug: 'eletronicos' },
  { id: 'MLB1652', name: 'Notebooks', slug: 'eletronicos' },
  { id: 'MLB1059', name: 'Fones de Ouvido', slug: 'fones' },
  { id: 'MLB1648', name: 'Processadores', slug: 'informatica' },
  { id: 'MLB1728', name: 'Placas de Vídeo', slug: 'informatica' },
  { id: 'MLB1729', name: 'Memória RAM', slug: 'informatica' },
  { id: 'MLB1713', name: 'SSD', slug: 'informatica' },
  { id: 'MLB1672', name: 'Monitores', slug: 'informatica' },
  { id: 'MLB1657', name: 'Teclados', slug: 'informatica' },
  { id: 'MLB1678', name: 'Mouses', slug: 'informatica' },
  { id: 'MLB1692', name: 'Gabinetes', slug: 'informatica' },
  { id: 'MLB1711', name: 'Fontes', slug: 'informatica' },
  { id: 'MLB1679', name: 'Placas-mãe', slug: 'informatica' },
  { id: 'MLB1144', name: 'Geladeiras', slug: 'eletrodomesticos' },
  { id: 'MLB1467', name: 'Fogões', slug: 'eletrodomesticos' },
  { id: 'MLB1469', name: 'Micro-ondas', slug: 'eletrodomesticos' },
  { id: 'MLB1470', name: 'Lavadoras', slug: 'eletrodomesticos' },
  { id: 'MLB1472', name: 'Aspiradores', slug: 'eletrodomesticos' },
  { id: 'MLB1474', name: 'Cafeteiras', slug: 'eletrodomesticos' },
  { id: 'MLB1475', name: 'Liquidificadores', slug: 'eletrodomesticos' },
  { id: 'MLB2029', name: 'Air Fryer', slug: 'eletrodomesticos' },
  { id: 'MLB1480', name: 'Ventiladores', slug: 'eletrodomesticos' },
  { id: 'MLB1459', name: 'Freezers', slug: 'eletrodomesticos' },
  { id: 'MLB1486', name: 'Tablets', slug: 'eletronicos' },
  { id: 'MLB1847', name: 'Smartwatches', slug: 'eletronicos' },
  { id: 'MLB1162', name: 'Caixas de Som', slug: 'audio' },
  { id: 'MLB1500', name: 'Projetores', slug: 'eletronicos' },
  { id: 'MLB1854', name: 'Roteadores', slug: 'eletronicos' },
  { id: 'MLB1142', name: 'Câmeras', slug: 'eletronicos' },
  { id: 'MLB1802', name: 'Soundbar', slug: 'audio' },
  { id: 'MLB1145', name: 'PlayStation', slug: 'games' },
  { id: 'MLB1146', name: 'Xbox', slug: 'games' },
  { id: 'MLB1147', name: 'Nintendo', slug: 'games' },
  { id: 'MLB1132', name: 'Jogos', slug: 'games' },
  { id: 'MLB1577', name: 'Cadeiras Gamer', slug: 'games' },
  { id: 'MLB1137', name: 'Sofás', slug: 'casa' },
  { id: 'MLB1499', name: 'Mesas', slug: 'casa' },
  { id: 'MLB1575', name: 'Camas', slug: 'casa' },
  { id: 'MLB1576', name: 'Colchões', slug: 'casa' },
  { id: 'MLB1139', name: 'Estantes', slug: 'casa' },
  { id: 'MLB1140', name: 'Racks', slug: 'casa' },
  { id: 'MLB1830', name: 'Tênis Masculino', slug: 'moda' },
  { id: 'MLB1831', name: 'Tênis Feminino', slug: 'moda' },
  { id: 'MLB1717', name: 'Relógios', slug: 'moda' },
  { id: 'MLB1774', name: 'Mochilas', slug: 'moda' },
  { id: 'MLB1775', name: 'Bolsas', slug: 'moda' },
  { id: 'MLB1488', name: 'Bicicletas', slug: 'esportes' },
  { id: 'MLB1490', name: 'Esteiras', slug: 'esportes' },
  { id: 'MLB2000', name: 'Suplementos', slug: 'esportes' },
  { id: 'MLB1747', name: 'Perfumes', slug: 'beleza' },
  { id: 'MLB1748', name: 'Maquiagem', slug: 'beleza' },
  { id: 'MLB1750', name: 'Skincare', slug: 'beleza' },
  { id: 'MLB1752', name: 'Cabelo', slug: 'beleza' },
  { id: 'MLB1762', name: 'Barbeadores', slug: 'beleza' },
  { id: 'MLB1552', name: 'Ferramentas Elétricas', slug: 'ferramentas' },
  { id: 'MLB1554', name: 'Kits de Ferramentas', slug: 'ferramentas' },
  { id: 'MLB1196', name: 'Livros', slug: 'livros' },
  { id: 'MLB1198', name: 'Kindle', slug: 'livros' },
  { id: 'MLB1864', name: 'Ração Pet', slug: 'pet' },
  { id: 'MLB1865', name: 'Brinquedos Pet', slug: 'pet' },
  { id: 'MLB1866', name: 'Camas Pet', slug: 'pet' },
  { id: 'MLB1867', name: 'Coleiras Pet', slug: 'pet' },
  { id: 'MLB1876', name: 'Fraldas Bebê', slug: 'bebe' },
  { id: 'MLB1880', name: 'Carrinhos Bebê', slug: 'bebe' },
  { id: 'MLB1881', name: 'Berços', slug: 'bebe' },
  { id: 'MLB1882', name: 'Cadeirinhas', slug: 'bebe' },
  { id: 'MLB1164', name: 'Violões', slug: 'audio' },
  { id: 'MLB1165', name: 'Guitarras', slug: 'audio' },
  { id: 'MLB1166', name: 'Teclados Musicais', slug: 'audio' },
  { id: 'MLB1167', name: 'Microfones', slug: 'audio' },
  { id: 'MLB1945', name: 'Pneus', slug: 'automotivo' },
  { id: 'MLB1933', name: 'Baterias Automotivas', slug: 'automotivo' },
  { id: 'MLB1934', name: 'Óleos Lubrificantes', slug: 'automotivo' },
  { id: 'MLB1935', name: 'Som Automotivo', slug: 'automotivo' },
]

const MLB_API = 'https://api.mercadolibre.com'
const API_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'DimDimIA/1.0',
}

interface SearchItem {
  id: string
  title: string
  price: number
  original_price: number | null
  thumbnail: string
  permalink: string
  category_id: string
  shipping: { free_shipping: boolean }
  seller: { id: number; nickname: string }
  sold_quantity: number
  available_quantity: number
  ratings?: { average: number }
}

interface SearchResponse {
  paging: { total: number; offset: number; limit: number }
  results: SearchItem[]
}

interface SalePrice {
  amount: number
  regular_amount: number | null
  currency_id: string
}

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: API_HEADERS })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function scrapeMLByCategory(
  slug: string,
  catId?: string
): Promise<ScrapedProduct[]> {
  if (!catId) return []

  const seen = new Set<string>()
  const candidates: SearchItem[] = []

  const base = `${MLB_API}/sites/MLB/search`
  const searchUrls = [
    `${base}?category=${catId}&limit=50`,
    `${base}?category=${catId}&q=OFF&limit=50`,
    `${base}?category=${catId}&q=promoção&limit=50`,
  ]

  for (const url of searchUrls) {
    const data = await getJSON<SearchResponse>(url)
    if (!data?.results) continue
    for (const item of data.results) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        candidates.push(item)
      }
    }
  }

  if (candidates.length === 0) return []

  const MAX_CHECK = 50
  const toCheck = candidates.slice(0, MAX_CHECK)
  const products: ScrapedProduct[] = []

  const priceResults = await Promise.allSettled(
    toCheck.map(item =>
      getJSON<SalePrice>(`${MLB_API}/items/${item.id}/sale_price?context=channel_marketplace`)
        .then(sale => ({ item, sale }))
    )
  )

  for (const result of priceResults) {
    if (result.status !== 'fulfilled') continue
    const { item, sale } = result.value
    if (!sale) continue

    const oldPrice = sale.regular_amount && sale.regular_amount > sale.amount
      ? sale.regular_amount
      : (item.original_price && item.original_price > item.price ? item.original_price : null)

    if (!oldPrice) continue

    products.push({
      name: item.title,
      description: item.title,
      price: sale.amount || item.price,
      oldPrice,
      store: 'Mercado Livre',
      imageUrl: item.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/200',
      productUrl: item.permalink,
      rating: item.ratings?.average || undefined,
      totalSales: item.sold_quantity || undefined,
      freeShipping: item.shipping?.free_shipping || false,
      sellerName: item.seller?.nickname || '',
      inStock: item.available_quantity > 0,
    })
  }

  return products
}

export async function scrapeMLSearch(query: string): Promise<ScrapedProduct[]> {
  const data = await getJSON<SearchResponse>(
    `${MLB_API}/sites/MLB/search?q=${encodeURIComponent(query)}&limit=50`
  )
  if (!data?.results) return []

  const toCheck = data.results.slice(0, 30)
  const products: ScrapedProduct[] = []

  const priceResults = await Promise.allSettled(
    toCheck.map(item =>
      getJSON<SalePrice>(`${MLB_API}/items/${item.id}/sale_price?context=channel_marketplace`)
        .then(sale => ({ item, sale }))
    )
  )

  for (const result of priceResults) {
    if (result.status !== 'fulfilled') continue
    const { item, sale } = result.value
    if (!sale) continue

    const oldPrice = sale.regular_amount && sale.regular_amount > sale.amount
      ? sale.regular_amount
      : (item.original_price && item.original_price > item.price ? item.original_price : null)

    if (!oldPrice) continue

    products.push({
      name: item.title,
      description: item.title,
      price: sale.amount || item.price,
      oldPrice,
      store: 'Mercado Livre',
      imageUrl: item.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/200',
      productUrl: item.permalink,
      rating: item.ratings?.average || undefined,
      totalSales: item.sold_quantity || undefined,
      freeShipping: item.shipping?.free_shipping || false,
      sellerName: item.seller?.nickname || '',
      inStock: item.available_quantity > 0,
    })
  }

  return products
}
