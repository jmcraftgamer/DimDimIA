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
}

export const CATEGORIES: CategoryGroup[] = [
  { name: 'Eletrodomésticos', slug: 'eletrodomesticos' },
  { name: 'Eletrônicos', slug: 'eletronicos' },
  { name: 'Celulares', slug: 'celulares' },
  { name: 'Fones', slug: 'fones' },
  { name: 'Informática', slug: 'informatica' },
  { name: 'Games', slug: 'games' },
  { name: 'Casa', slug: 'casa' },
  { name: 'Moda', slug: 'moda' },
  { name: 'Beleza', slug: 'beleza' },
  { name: 'Esportes', slug: 'esportes' },
  { name: 'Automotivo', slug: 'automotivo' },
  { name: 'Livros', slug: 'livros' },
  { name: 'Ferramentas', slug: 'ferramentas' },
  { name: 'Pet', slug: 'pet' },
  { name: 'Bebê', slug: 'bebe' },
  { name: 'Áudio', slug: 'audio' },
]

export const SUBCATEGORIES: Record<string, { name: string; keyword: string }[]> = {
  fones: [
    { name: 'Bluetooth', keyword: 'bluetooth' },
    { name: 'Headset', keyword: 'headset' },
    { name: 'Sem Fio', keyword: 'sem fio' },
    { name: 'Com Fio', keyword: 'com fio' },
    { name: 'Microfone', keyword: 'microfone' },
  ],
  celulares: [
    { name: 'Apple', keyword: 'iphone' },
    { name: 'Samsung', keyword: 'samsung' },
    { name: 'Xiaomi', keyword: 'xiaomi' },
    { name: 'Motorola', keyword: 'motorola' },
    { name: 'Acessórios', keyword: 'capa celular' },
  ],
  informatica: [
    { name: 'Notebook', keyword: 'notebook' },
    { name: 'Processador', keyword: 'processador' },
    { name: 'Placa de Vídeo', keyword: 'placa de video' },
    { name: 'SSD', keyword: 'ssd' },
    { name: 'Monitor', keyword: 'monitor' },
    { name: 'Teclado', keyword: 'teclado' },
    { name: 'Mouse', keyword: 'mouse' },
  ],
  games: [
    { name: 'PlayStation', keyword: 'playstation' },
    { name: 'Xbox', keyword: 'xbox' },
    { name: 'Nintendo', keyword: 'nintendo' },
    { name: 'Cadeira Gamer', keyword: 'cadeira gamer' },
    { name: 'Jogos', keyword: 'jogos' },
  ],
  eletrodomesticos: [
    { name: 'Geladeira', keyword: 'geladeira' },
    { name: 'Fogão', keyword: 'fogao' },
    { name: 'Micro-ondas', keyword: 'micro-ondas' },
    { name: 'Air Fryer', keyword: 'air fryer' },
    { name: 'Lavadora', keyword: 'lavadora' },
    { name: 'Cafeteira', keyword: 'cafeteira' },
  ],
  moda: [
    { name: 'Tênis', keyword: 'tenis' },
    { name: 'Camiseta', keyword: 'camiseta' },
    { name: 'Jaqueta', keyword: 'jaqueta' },
    { name: 'Calça', keyword: 'calca' },
    { name: 'Vestido', keyword: 'vestido' },
  ],
  pet: [
    { name: 'Ração', keyword: 'racao' },
    { name: 'Brinquedos', keyword: 'brinquedos pet' },
    { name: 'Camas', keyword: 'cama pet' },
    { name: 'Coleiras', keyword: 'coleira' },
  ],
  esportes: [
    { name: 'Bicicleta', keyword: 'bicicleta' },
    { name: 'Esteira', keyword: 'esteira' },
    { name: 'Suplementos', keyword: 'suplemento' },
    { name: 'Skate', keyword: 'skate' },
    { name: 'Camping', keyword: 'camping' },
  ],
  beleza: [
    { name: 'Perfume', keyword: 'perfume' },
    { name: 'Maquiagem', keyword: 'maquiagem' },
    { name: 'Skincare', keyword: 'skincare' },
    { name: 'Cabelo', keyword: 'cabelo' },
    { name: 'Barbeador', keyword: 'barbeador' },
  ],
  automotivo: [
    { name: 'Pneu', keyword: 'pneu' },
    { name: 'Bateria', keyword: 'bateria automotiva' },
    { name: 'Óleo', keyword: 'oleo motor' },
    { name: 'Som', keyword: 'som automotivo' },
  ],
  audio: [
    { name: 'Caixa de Som', keyword: 'caixa de som' },
    { name: 'Soundbar', keyword: 'soundbar' },
    { name: 'Home Theater', keyword: 'home theater' },
    { name: 'Microfone', keyword: 'microfone' },
  ],
  casa: [
    { name: 'Sofá', keyword: 'sofa' },
    { name: 'Mesa', keyword: 'mesa' },
    { name: 'Cama', keyword: 'cama' },
    { name: 'Colchão', keyword: 'colchao' },
    { name: 'Estante', keyword: 'estante' },
    { name: 'Decoração', keyword: 'decoracao' },
  ],
}

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
