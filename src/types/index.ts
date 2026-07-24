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
  position?: number
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
  { name: 'Celulares', slug: 'celulares' },
  { name: 'Informática', slug: 'informatica' },
  { name: 'Eletrodomésticos', slug: 'eletrodomesticos' },
  { name: 'Eletrônicos', slug: 'eletronicos' },
  { name: 'Games', slug: 'games' },
  { name: 'Moda', slug: 'moda' },
  { name: 'Fones', slug: 'fones' },
  { name: 'Beleza', slug: 'beleza' },
  { name: 'Casa', slug: 'casa' },
  { name: 'Esportes', slug: 'esportes' },
  { name: 'Automotivo', slug: 'automotivo' },
  { name: 'Ferramentas', slug: 'ferramentas' },
  { name: 'Pet', slug: 'pet' },
  { name: 'Áudio', slug: 'audio' },
  { name: 'Bebê', slug: 'bebe' },
  { name: 'Livros', slug: 'livros' },
]

export const SUBCATEGORIES: Record<string, { name: string; keyword: string }[]> = {
  celulares: [
    { name: 'Apple iPhone', keyword: 'iphone' },
    { name: 'Samsung Galaxy', keyword: 'samsung galaxy' },
    { name: 'Xiaomi', keyword: 'xiaomi' },
    { name: 'Motorola', keyword: 'motorola' },
    { name: 'Smartphones 5G', keyword: '5g' },
    { name: 'Capas', keyword: 'capa celular' },
    { name: 'Películas', keyword: 'pelicula' },
    { name: 'Carregadores', keyword: 'carregador celular' },
  ],
  informatica: [
    { name: 'Notebooks', keyword: 'notebook' },
    { name: 'Placas de Vídeo', keyword: 'placa de video' },
    { name: 'Processadores', keyword: 'processador' },
    { name: 'SSD', keyword: 'ssd' },
    { name: 'Memória RAM', keyword: 'memoria ram' },
    { name: 'Monitores', keyword: 'monitor' },
    { name: 'Teclados', keyword: 'teclado' },
    { name: 'Mouses', keyword: 'mouse' },
    { name: 'Gabinetes', keyword: 'gabinete' },
    { name: 'Impressoras', keyword: 'impressora' },
    { name: 'HD Externo', keyword: 'hd externo' },
    { name: 'Webcams', keyword: 'webcam' },
  ],
  eletrodomesticos: [
    { name: 'Geladeiras', keyword: 'geladeira' },
    { name: 'Fogões', keyword: 'fogao' },
    { name: 'Micro-ondas', keyword: 'micro-ondas' },
    { name: 'Air Fryer', keyword: 'air fryer' },
    { name: 'Lavadoras', keyword: 'lavadora' },
    { name: 'Aspiradores', keyword: 'aspirador' },
    { name: 'Cafeteiras', keyword: 'cafeteira' },
    { name: 'Freezers', keyword: 'freezer' },
    { name: 'Purificadores', keyword: 'purificador' },
    { name: 'Liquidificadores', keyword: 'liquidificador' },
  ],
  eletronicos: [
    { name: 'TVs 4K', keyword: 'smart tv 4k' },
    { name: 'TVs OLED', keyword: 'tv oled' },
    { name: 'Tablets', keyword: 'tablet' },
    { name: 'Smartwatches', keyword: 'smartwatch' },
    { name: 'Câmeras', keyword: 'camera digital' },
    { name: 'Projetores', keyword: 'projetor' },
    { name: 'Roteadores', keyword: 'roteador wifi' },
    { name: 'Soundbar', keyword: 'soundbar' },
    { name: 'Drone', keyword: 'drone' },
  ],
  games: [
    { name: 'PlayStation 5', keyword: 'playstation 5' },
    { name: 'Xbox Series', keyword: 'xbox series' },
    { name: 'Nintendo Switch', keyword: 'nintendo switch' },
    { name: 'Cadeiras Gamer', keyword: 'cadeira gamer' },
    { name: 'Headsets Gamer', keyword: 'headset gamer' },
    { name: 'Teclados Gamer', keyword: 'teclado gamer' },
    { name: 'Mouses Gamer', keyword: 'mouse gamer' },
    { name: 'Jogos', keyword: 'jogos' },
  ],
  fones: [
    { name: 'Bluetooth', keyword: 'fone bluetooth' },
    { name: 'Headset', keyword: 'headset' },
    { name: 'Sem Fio', keyword: 'fone sem fio' },
    { name: 'Com Fio', keyword: 'fone com fio' },
    { name: 'AirPods', keyword: 'airpods' },
    { name: 'Microfone', keyword: 'microfone' },
  ],
  moda: [
    { name: 'Tênis Masculino', keyword: 'tenis masculino' },
    { name: 'Tênis Feminino', keyword: 'tenis feminino' },
    { name: 'Camisetas', keyword: 'camiseta' },
    { name: 'Jaquetas', keyword: 'jaqueta' },
    { name: 'Calças', keyword: 'calca' },
    { name: 'Vestidos', keyword: 'vestido' },
    { name: 'Relógios', keyword: 'relogio' },
    { name: 'Mochilas', keyword: 'mochila' },
    { name: 'Óculos', keyword: 'oculos de sol' },
  ],
  beleza: [
    { name: 'Perfumes', keyword: 'perfume' },
    { name: 'Maquiagem', keyword: 'maquiagem' },
    { name: 'Skincare', keyword: 'skincare' },
    { name: 'Cabelo', keyword: 'cabelo' },
    { name: 'Barbeadores', keyword: 'barbeador' },
    { name: 'Secadores', keyword: 'secador de cabelo' },
  ],
  casa: [
    { name: 'Sofás', keyword: 'sofa' },
    { name: 'Mesas', keyword: 'mesa' },
    { name: 'Camas', keyword: 'cama' },
    { name: 'Colchões', keyword: 'colchao' },
    { name: 'Estantes', keyword: 'estante' },
    { name: 'Decoração', keyword: 'decoracao' },
    { name: 'Cortinas', keyword: 'cortina' },
    { name: 'Tapetes', keyword: 'tapete' },
    { name: 'Cadeiras', keyword: 'cadeira escritorio' },
  ],
  esportes: [
    { name: 'Bicicletas', keyword: 'bicicleta' },
    { name: 'Esteiras', keyword: 'esteira' },
    { name: 'Suplementos', keyword: 'suplemento' },
    { name: 'Skate', keyword: 'skate' },
    { name: 'Camping', keyword: 'camping' },
    { name: 'Musculação', keyword: 'musculacao' },
    { name: 'Bolas', keyword: 'bola' },
    { name: 'Roupas Esportivas', keyword: 'roupa esportiva' },
  ],
  automotivo: [
    { name: 'Pneus', keyword: 'pneu' },
    { name: 'Baterias', keyword: 'bateria automotiva' },
    { name: 'Óleos', keyword: 'oleo motor' },
    { name: 'Som Automotivo', keyword: 'som automotivo' },
    { name: 'Faróis', keyword: 'farol' },
    { name: 'Capacetes', keyword: 'capacete' },
    { name: 'Acessórios', keyword: 'acessorio carro' },
  ],
  ferramentas: [
    { name: 'Furadeiras', keyword: 'furadeira' },
    { name: 'Kits de Ferramentas', keyword: 'kit ferramentas' },
    { name: 'Parafusadeiras', keyword: 'parafusadeira' },
    { name: 'Serras', keyword: 'serra' },
    { name: 'Equipamentos Jardim', keyword: 'jardim' },
  ],
  pet: [
    { name: 'Ração', keyword: 'racao' },
    { name: 'Brinquedos', keyword: 'brinquedo pet' },
    { name: 'Camas', keyword: 'cama pet' },
    { name: 'Coleiras', keyword: 'coleira' },
    { name: 'Gaiolas', keyword: 'gaiola' },
  ],
  audio: [
    { name: 'Caixas de Som', keyword: 'caixa de som' },
    { name: 'Soundbar', keyword: 'soundbar' },
    { name: 'Home Theater', keyword: 'home theater' },
    { name: 'Microfones', keyword: 'microfone' },
    { name: 'Violões', keyword: 'violao' },
    { name: 'Guitarras', keyword: 'guitarra' },
    { name: 'Teclados Musicais', keyword: 'teclado musical' },
  ],
  bebe: [
    { name: 'Fraldas', keyword: 'fralda' },
    { name: 'Carrinhos', keyword: 'carrinho bebe' },
    { name: 'Berços', keyword: 'berco' },
    { name: 'Cadeirinhas', keyword: 'cadeirinha' },
    { name: 'Brinquedos', keyword: 'brinquedo bebe' },
  ],
  livros: [
    { name: 'Romances', keyword: 'romance' },
    { name: 'Autoajuda', keyword: 'autoajuda' },
    { name: 'Infantis', keyword: 'livro infantil' },
    { name: 'Técnicos', keyword: 'livro tecnico' },
    { name: 'HQs', keyword: 'quadrinhos' },
    { name: 'Kindle', keyword: 'kindle' },
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
