export interface ProductData {
  id: string
  name: string
  description: string | null
  price: number
  oldPrice: number | null
  coupon: string | null
  couponCode: string | null
  category: string
  subcategory?: string
  store: string
  imageUrl: string | null
  productUrl: string
  rating: number | null
  totalSales: number | null
  freeShipping: boolean | null
  tax: number | null
  position: number | null
  score?: number | null
  reason?: string | null
  isActive?: boolean
}

export interface ScrapedProduct {
  name: string
  description: string
  price: number
  oldPrice?: number
  coupon?: string
  couponCode?: string
  store: string
  imageUrl: string
  productUrl: string
  rating?: number
  totalSales?: number
  freeShipping?: boolean
  tax?: number
  sellerName?: string
  inStock?: boolean
}

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
}

export interface MonitorData {
  id: string
  name: string
  url: string
  store: string
  targetPrice: number | null
  currentPrice: number | null
  onSale: boolean
  lastChecked: string | null
}

export interface CategoryGroup {
  name: string
  slug: string
  icon: string
}

export const CATEGORIES: CategoryGroup[] = [
  { name: 'Eletrodomésticos', slug: 'eletrodomesticos', icon: '📺' },
  { name: 'Eletrônicos', slug: 'eletronicos', icon: '💻' },
  { name: 'Celulares', slug: 'celulares', icon: '📱' },
  { name: 'Fones', slug: 'fones', icon: '🎧' },
  { name: 'Informática', slug: 'informatica', icon: '🖥️' },
  { name: 'Games', slug: 'games', icon: '🎮' },
  { name: 'Casa', slug: 'casa', icon: '🏠' },
  { name: 'Moda', slug: 'moda', icon: '👕' },
  { name: 'Beleza', slug: 'beleza', icon: '💄' },
  { name: 'Esportes', slug: 'esportes', icon: '⚽' },
  { name: 'Automotivo', slug: 'automotivo', icon: '🚗' },
  { name: 'Livros', slug: 'livros', icon: '📚' },
  { name: 'Ferramentas', slug: 'ferramentas', icon: '🔧' },
  { name: 'Pet', slug: 'pet', icon: '🐾' },
  { name: 'Bebê', slug: 'bebe', icon: '👶' },
  { name: 'Áudio', slug: 'audio', icon: '🎵' },
]

export const STORES = [
  'Mercado Livre',
  'Amazon',
  'Shopee',
  'AliExpress',
  'Kabum',
  'Pichau',
  'TerabyteShop',
]

export const PRESET_QUERIES = [
  'Melhores notebooks em promoção',
  'Celulares com melhor custo-benefício',
  'Fones de ouvido com desconto',
  'Processadores em oferta',
  'Monitores baratos',
  'SSD em promoção',
  'Air fryer mais barata',
  'Tênis de corrida em promoção',
]
