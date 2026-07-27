import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'
import { getValidAccessToken, isMLApiConfigured } from '../ml-auth'

const MIN_STOCK = 50

export interface MLBCategory {
  id: string
  name: string
  slug: string
}

export const MLB_CATEGORIES: MLBCategory[] = [
  { id: 'MLB1051', name: 'Celulares', slug: 'celulares' },
  { id: 'MLB1055', name: 'TVs', slug: 'tv' },
  { id: 'MLB1652', name: 'Notebooks', slug: 'notebooks' },
  { id: 'MLB1059', name: 'Fones de Ouvido', slug: 'fones-de-ouvido' },
  { id: 'MLB1648', name: 'Processadores', slug: 'processadores' },
  { id: 'MLB1728', name: 'Placas de Vídeo', slug: 'placas-de-video' },
  { id: 'MLB1729', name: 'Memória RAM', slug: 'memoria-ram' },
  { id: 'MLB1713', name: 'SSD', slug: 'ssd' },
  { id: 'MLB1672', name: 'Monitores', slug: 'monitores' },
  { id: 'MLB1657', name: 'Teclados', slug: 'teclados' },
  { id: 'MLB1678', name: 'Mouses', slug: 'mouses' },
  { id: 'MLB1692', name: 'Gabinetes', slug: 'gabinetes' },
  { id: 'MLB1711', name: 'Fontes', slug: 'fontes' },
  { id: 'MLB1679', name: 'Placas-mãe', slug: 'placas-mae' },
  { id: 'MLB1144', name: 'Geladeiras', slug: 'geladeiras' },
  { id: 'MLB1467', name: 'Fogões', slug: 'fogoes' },
  { id: 'MLB1469', name: 'Micro-ondas', slug: 'micro-ondas' },
  { id: 'MLB1470', name: 'Lavadoras', slug: 'lavadoras' },
  { id: 'MLB1472', name: 'Aspiradores', slug: 'aspiradores' },
  { id: 'MLB1474', name: 'Cafeteiras', slug: 'cafeteiras' },
  { id: 'MLB1475', name: 'Liquidificadores', slug: 'liquidificadores' },
  { id: 'MLB2029', name: 'Air Fryer', slug: 'air-fryer' },
  { id: 'MLB1480', name: 'Ventiladores', slug: 'ventiladores' },
  { id: 'MLB1459', name: 'Freezers', slug: 'freezers' },
  { id: 'MLB1486', name: 'Tablets', slug: 'tablets' },
  { id: 'MLB1847', name: 'Smartwatches', slug: 'smartwatches' },
  { id: 'MLB1162', name: 'Caixas de Som', slug: 'caixas-de-som' },
  { id: 'MLB1500', name: 'Projetores', slug: 'projetores' },
  { id: 'MLB1854', name: 'Roteadores', slug: 'roteadores' },
  { id: 'MLB1142', name: 'Câmeras', slug: 'cameras' },
  { id: 'MLB1802', name: 'Soundbar', slug: 'soundbar' },
  { id: 'MLB1145', name: 'PlayStation', slug: 'playstation' },
  { id: 'MLB1146', name: 'Xbox', slug: 'xbox' },
  { id: 'MLB1147', name: 'Nintendo', slug: 'nintendo' },
  { id: 'MLB1132', name: 'Jogos', slug: 'jogos' },
  { id: 'MLB1577', name: 'Cadeiras Gamer', slug: 'cadeiras-gamer' },
  { id: 'MLB1137', name: 'Sofás', slug: 'sofas' },
  { id: 'MLB1499', name: 'Mesas', slug: 'mesas' },
  { id: 'MLB1575', name: 'Camas', slug: 'camas' },
  { id: 'MLB1576', name: 'Colchões', slug: 'colchoes' },
  { id: 'MLB1139', name: 'Estantes', slug: 'estantes' },
  { id: 'MLB1140', name: 'Racks', slug: 'racks' },
  { id: 'MLB1830', name: 'Tênis Masculino', slug: 'tenis-masculino' },
  { id: 'MLB1831', name: 'Tênis Feminino', slug: 'tenis-feminino' },
  { id: 'MLB1717', name: 'Relógios', slug: 'relogios' },
  { id: 'MLB1774', name: 'Mochilas', slug: 'mochilas' },
  { id: 'MLB1775', name: 'Bolsas', slug: 'bolsas' },
  { id: 'MLB1488', name: 'Bicicletas', slug: 'bicicletas' },
  { id: 'MLB1490', name: 'Esteiras', slug: 'esteiras' },
  { id: 'MLB2000', name: 'Suplementos', slug: 'suplementos' },
  { id: 'MLB1747', name: 'Perfumes', slug: 'perfumes' },
  { id: 'MLB1748', name: 'Maquiagem', slug: 'maquiagem' },
  { id: 'MLB1750', name: 'Skincare', slug: 'skincare' },
  { id: 'MLB1752', name: 'Cabelo', slug: 'cabelo' },
  { id: 'MLB1762', name: 'Barbeadores', slug: 'barbeadores' },
  { id: 'MLB1552', name: 'Ferramentas Elétricas', slug: 'ferramentas-eletricas' },
  { id: 'MLB1554', name: 'Kits de Ferramentas', slug: 'kits-ferramentas' },
  { id: 'MLB1196', name: 'Livros', slug: 'livros' },
  { id: 'MLB1198', name: 'Kindle', slug: 'kindle' },
  { id: 'MLB1864', name: 'Ração Pet', slug: 'racao-pet' },
  { id: 'MLB1865', name: 'Brinquedos Pet', slug: 'brinquedos-pet' },
  { id: 'MLB1866', name: 'Camas Pet', slug: 'camas-pet' },
  { id: 'MLB1867', name: 'Coleiras Pet', slug: 'coleiras-pet' },
  { id: 'MLB1876', name: 'Fraldas Bebê', slug: 'fraldas-bebe' },
  { id: 'MLB1880', name: 'Carrinhos Bebê', slug: 'carrinhos-bebe' },
  { id: 'MLB1881', name: 'Berços', slug: 'bercos' },
  { id: 'MLB1882', name: 'Cadeirinhas', slug: 'cadeirinhas' },
  { id: 'MLB1164', name: 'Violões', slug: 'violoes' },
  { id: 'MLB1165', name: 'Guitarras', slug: 'guitarras' },
  { id: 'MLB1166', name: 'Teclados Musicais', slug: 'teclados-musicais' },
  { id: 'MLB1167', name: 'Microfones', slug: 'microfones' },
  { id: 'MLB1945', name: 'Pneus', slug: 'pneus' },
  { id: 'MLB1933', name: 'Baterias Automotivas', slug: 'baterias-automotivas' },
  { id: 'MLB1934', name: 'Óleos Lubrificantes', slug: 'oleos' },
  { id: 'MLB1935', name: 'Som Automotivo', slug: 'som-automotivo' },
  { id: 'MLB1574', name: 'Impressoras', slug: 'impressoras' },
  { id: 'MLB1693', name: 'HD Externo', slug: 'hd-externo' },
  { id: 'MLB1694', name: 'Pendrives', slug: 'pen-drives' },
  { id: 'MLB1695', name: 'Webcams', slug: 'webcams' },
  { id: 'MLB1700', name: 'Roteadores Wi-Fi', slug: 'roteadores-wifi' },
  { id: 'MLB1706', name: 'Cabos', slug: 'cabos' },
  { id: 'MLB1714', name: 'Tablets Gráficos', slug: 'tablets-graficos' },
  { id: 'MLB1726', name: 'Coolers', slug: 'coolers' },
  { id: 'MLB1730', name: 'Placas de Som', slug: 'placas-de-som' },
  { id: 'MLB1731', name: 'Placas de Captura', slug: 'placas-de-captura' },
  { id: 'MLB1740', name: 'Servidores', slug: 'servidores' },
  { id: 'MLB1741', name: 'Estabilizadores', slug: 'estabilizadores' },
  { id: 'MLB1742', name: 'No-breaks', slug: 'no-breaks' },
  { id: 'MLB1767', name: 'Fones Bluetooth', slug: 'fones-bluetooth' },
  { id: 'MLB1768', name: 'Caixas Bluetooth', slug: 'caixas-bluetooth' },
  { id: 'MLB1770', name: 'Home Theater', slug: 'home-theater' },
  { id: 'MLB1771', name: 'Barras de Som', slug: 'barras-de-som' },
  { id: 'MLB1788', name: 'Câmeras de Segurança', slug: 'cameras-seguranca' },
  { id: 'MLB1806', name: 'Drone', slug: 'drone' },
  { id: 'MLB1820', name: 'Roupas Esportivas', slug: 'roupas-esportivas' },
  { id: 'MLB1823', name: 'Tênis Casual', slug: 'tenis-casual' },
  { id: 'MLB1828', name: 'Camisetas', slug: 'camisetas' },
  { id: 'MLB1833', name: 'Jaquetas', slug: 'jaquetas' },
  { id: 'MLB1836', name: 'Calças', slug: 'calcas' },
  { id: 'MLB1840', name: 'Shorts', slug: 'shorts' },
  { id: 'MLB1843', name: 'Vestidos', slug: 'vestidos' },
  { id: 'MLB1850', name: 'Óculos de Sol', slug: 'oculos-de-sol' },
  { id: 'MLB1852', name: 'Mochilas Escolares', slug: 'mochilas-escolares' },
  { id: 'MLB1855', name: 'Carregadores', slug: 'carregadores' },
  { id: 'MLB1856', name: 'Capas Celular', slug: 'capas-celular' },
  { id: 'MLB1857', name: 'Películas', slug: 'peliculas' },
  { id: 'MLB1858', name: 'Suportes Celular', slug: 'suportes-celular' },
  { id: 'MLB1860', name: 'Fones Infantis', slug: 'fones-infantis' },
  { id: 'MLB1885', name: 'Brinquedos', slug: 'brinquedos' },
  { id: 'MLB1887', name: 'Jogos de Tabuleiro', slug: 'jogos-tabuleiro' },
  { id: 'MLB1888', name: 'Carrinhos', slug: 'carrinhos' },
  { id: 'MLB1889', name: 'Bonecas', slug: 'bonecas' },
  { id: 'MLB1890', name: 'Pelúcias', slug: 'pelucias' },
  { id: 'MLB1892', name: 'Lego', slug: 'lego' },
  { id: 'MLB1895', name: 'Skate', slug: 'skate' },
  { id: 'MLB1896', name: 'Patinete', slug: 'patinete' },
  { id: 'MLB1897', name: 'Patins', slug: 'patins' },
  { id: 'MLB1900', name: 'Bolas', slug: 'bolas' },
  { id: 'MLB1905', name: 'Acampamento', slug: 'acampamento' },
  { id: 'MLB1910', name: 'Cozinha', slug: 'cozinha' },
  { id: 'MLB1911', name: 'Panelas', slug: 'panelas' },
  { id: 'MLB1912', name: 'Talheres', slug: 'talheres' },
  { id: 'MLB1913', name: 'Pratos', slug: 'pratos' },
  { id: 'MLB1914', name: 'Copos', slug: 'copos' },
  { id: 'MLB1920', name: 'Cadeiras de Escritório', slug: 'cadeiras-escritorio' },
  { id: 'MLB1921', name: 'Mesas Escritório', slug: 'mesas-escritorio' },
  { id: 'MLB1922', name: 'Escrivaninhas', slug: 'escrivaninhas' },
  { id: 'MLB1923', name: 'Estações de Trabalho', slug: 'estacoes-trabalho' },
  { id: 'MLB1930', name: 'Lavagem Automotiva', slug: 'lavagem-automotiva' },
  { id: 'MLB1931', name: 'Ferramentas Automotivas', slug: 'ferramentas-automotivas' },
  { id: 'MLB1932', name: 'Acessórios Carro', slug: 'acessorios-carro' },
  { id: 'MLB1936', name: 'Faróis', slug: 'farois' },
  { id: 'MLB1937', name: 'Painéis', slug: 'paineis' },
  { id: 'MLB1940', name: 'Ferramentas Manuais', slug: 'ferramentas-manuais' },
  { id: 'MLB1941', name: 'Ferramentas Jardim', slug: 'ferramentas-jardim' },
  { id: 'MLB1942', name: 'Máquinas', slug: 'maquinas' },
  { id: 'MLB1943', name: 'Equipamentos Segurança', slug: 'equipamentos-seguranca' },
  { id: 'MLB1944', name: 'Tintas', slug: 'tintas' },
  { id: 'MLB1950', name: 'Cama Mesa Banho', slug: 'cama-mesa-banho' },
  { id: 'MLB1951', name: 'Toalhas', slug: 'toalhas' },
  { id: 'MLB1952', name: 'Lençóis', slug: 'lencois' },
  { id: 'MLB1953', name: 'Edredons', slug: 'edredons' },
  { id: 'MLB1954', name: 'Tapetes', slug: 'tapetes' },
  { id: 'MLB1955', name: 'Cortinas', slug: 'cortinas' },
  { id: 'MLB1956', name: 'Almofadas', slug: 'almofadas' },
  { id: 'MLB1960', name: 'Decoração', slug: 'decoracao' },
  { id: 'MLB1961', name: 'Quadros', slug: 'quadros' },
  { id: 'MLB1962', name: 'Vasos', slug: 'vasos' },
  { id: 'MLB1963', name: 'Espelhos', slug: 'espelhos' },
  { id: 'MLB1964', name: 'Luminárias', slug: 'luminarias' },
  { id: 'MLB1970', name: 'Fitness', slug: 'fitness' },
  { id: 'MLB1971', name: 'Yoga', slug: 'yoga' },
  { id: 'MLB1972', name: 'Musculação', slug: 'musculacao' },
  { id: 'MLB1973', name: 'Corrida', slug: 'corrida' },
  { id: 'MLB1974', name: 'Natação', slug: 'natacao' },
  { id: 'MLB1975', name: 'Ciclismo', slug: 'ciclismo' },
  { id: 'MLB1980', name: 'Camping', slug: 'camping' },
  { id: 'MLB1981', name: 'Barracas', slug: 'barracas' },
  { id: 'MLB1982', name: 'Sacos de Dormir', slug: 'sacos-dormir' },
  { id: 'MLB1983', name: 'Mochilões', slug: 'mochiloes' },
  { id: 'MLB1990', name: 'Relógios Masculinos', slug: 'relogios-masculinos' },
  { id: 'MLB1991', name: 'Relógios Femininos', slug: 'relogios-femininos' },
  { id: 'MLB1992', name: 'Relógios Infantis', slug: 'relogios-infantis' },
  { id: 'MLB1995', name: 'Anéis', slug: 'aneis' },
  { id: 'MLB1996', name: 'Brincos', slug: 'brincos' },
  { id: 'MLB1997', name: 'Pulseiras', slug: 'pulseiras' },
  { id: 'MLB1998', name: 'Colares', slug: 'colares' },
  { id: 'MLB2001', name: 'Vitaminas', slug: 'vitaminas' },
  { id: 'MLB2002', name: 'Whey Protein', slug: 'whey-protein' },
  { id: 'MLB2003', name: 'Creatina', slug: 'creatina' },
  { id: 'MLB2004', name: 'Termogênicos', slug: 'termogenicos' },
  { id: 'MLB2010', name: 'Secadores de Cabelo', slug: 'secadores-cabelo' },
  { id: 'MLB2011', name: 'Pranchas', slug: 'pranchas' },
  { id: 'MLB2012', name: 'Modeladores', slug: 'modeladores' },
  { id: 'MLB2013', name: 'Escovas', slug: 'escovas' },
  { id: 'MLB2020', name: 'Máquinas de Costura', slug: 'maquinas-costura' },
  { id: 'MLB2021', name: 'Ferros de Passar', slug: 'ferros-passar' },
  { id: 'MLB2022', name: 'Aspiradores Robô', slug: 'aspiradores-robo' },
  { id: 'MLB2025', name: 'Purificadores', slug: 'purificadores' },
  { id: 'MLB2026', name: 'Bebedouros', slug: 'bebedouros' },
  { id: 'MLB2027', name: 'Climatizadores', slug: 'climatizadores' },
  { id: 'MLB2030', name: 'Frigobares', slug: 'frigobares' },
  { id: 'MLB2031', name: 'Cervejeiras', slug: 'cervejeiras' },
  { id: 'MLB2035', name: 'Instrumentos Musicais', slug: 'instrumentos-musicais' },
  { id: 'MLB2036', name: 'Teclados', slug: 'teclados-musicais' },
  { id: 'MLB2037', name: 'Violões', slug: 'violoes' },
  { id: 'MLB2038', name: 'Baterias Musicais', slug: 'baterias-musicais' },
  { id: 'MLB2039', name: 'Saxofones', slug: 'saxofones' },
  { id: 'MLB2040', name: 'Guitarras', slug: 'guitarras' },
  { id: 'MLB2041', name: 'Contrabaixos', slug: 'contrabaixos' },
  { id: 'MLB2045', name: 'Acessórios Moto', slug: 'acessorios-moto' },
  { id: 'MLB2046', name: 'Capacetes', slug: 'capacetes' },
  { id: 'MLB2047', name: 'Luvas Moto', slug: 'luvas-moto' },
  { id: 'MLB2048', name: 'Baús Moto', slug: 'baus-moto' },
  { id: 'MLB2050', name: 'Piscinas', slug: 'piscinas' },
  { id: 'MLB2051', name: 'Brinquedos Infláveis', slug: 'brinquedos-inflaveis' },
  { id: 'MLB2052', name: 'Churrasqueiras', slug: 'churrasqueiras' },
  { id: 'MLB2053', name: 'Espaços Gourmet', slug: 'espacos-gourmet' },
]

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
}

function parseBRL(text: string): number {
  const cleaned = text.replace(/[R$\s\.]/g, '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function parsePolyCard($el: cheerio.Cheerio<any>): ScrapedProduct | null {
  const link = $el.find('.poly-component__title-wrapper a').first().attr('href')
  if (!link || !link.includes('mercadolivre')) return null

  const name = $el.find('.poly-component__title').first().text().trim()
  if (!name) return null

  const img = $el.find('.poly-component__picture').first().attr('src')
    || $el.find('img').first().attr('data-src')
    || $el.find('img').first().attr('src') || ''

  const oldPriceEl = $el.find('s.andes-money-amount--previous .andes-money-amount__fraction').first()
  const oldPriceCents = $el.find('s.andes-money-amount--previous .andes-money-amount__cents').first()
  const oldPriceText = oldPriceEl.text().trim()
  const oldPriceCentsText = oldPriceCents.text().trim()

  const newPriceEl = $el.find('.poly-price__amount .andes-money-amount__fraction').first()
  const newPriceCents = $el.find('.poly-price__amount .andes-money-amount__cents').first()
  const newPriceText = newPriceEl.text().trim()
  const newPriceCentsText = newPriceCents.text().trim()

  const price = parseBRL(newPriceText + (newPriceCentsText ? ',' + newPriceCentsText : ''))
  let oldPrice = oldPriceText ? parseBRL(oldPriceText + (oldPriceCentsText ? ',' + oldPriceCentsText : '')) : 0

  if (!oldPrice || oldPrice <= price) {
    const discountText = $el.find('.polylabel-pill').first().text().trim()
    const pct = parseInt(discountText.replace(/\D/g, ''))
    if (pct > 0 && pct < 100 && price > 0) {
      oldPrice = Math.round(price / (1 - pct / 100))
    }
  }

  if (!oldPrice || oldPrice <= price || !price) return null

  const seller = $el.find('.poly-component__seller').first().text().trim()
  const freeShipping = $el.text().toLowerCase().includes('frete grátis') || $el.text().toLowerCase().includes('frete gratis')

  return {
    name,
    description: name,
    price,
    oldPrice,
    store: 'Mercado Livre',
    imageUrl: img.startsWith('http') ? img : `https:${img}`,
    productUrl: link,
    freeShipping,
    sellerName: seller,
    inStock: true,
  }
}

const API_BASE = 'https://api.mercadolibre.com/sites/MLB/search'

function apiProductToScraped(item: any, position: number): ScrapedProduct | null {
  const originalPrice = item.original_price ?? item.sale_price?.regular_amount ?? null
  if (!originalPrice || originalPrice <= item.price) return null

  const discount = Math.round((1 - item.price / originalPrice) * 100)
  if (discount < 5) return null

  if (!item.available_quantity || item.available_quantity < MIN_STOCK) return null

  return {
    name: item.title,
    description: item.title,
    price: item.price,
    oldPrice: originalPrice,
    store: 'Mercado Livre',
    imageUrl: item.thumbnail?.replace(/-I\.jpg/, '-O.jpg') ?? '',
    productUrl: item.permalink ?? '',
    freeShipping: item.shipping?.free_shipping ?? false,
    sellerName: item.seller?.nickname ?? '',
    inStock: true,
    position,
    availableQuantity: item.available_quantity,
  }
}

const BATCH_PARALLEL = 10
const DELAY_BETWEEN_BATCHES = 100
const OFFERS_MAX_PAGES = 30

async function fetchApiPage(params: any): Promise<any[]> {
  try {
    const headers: Record<string, string> = { ...HEADERS }
    const token = await getValidAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    const { data } = await axios.get(API_BASE, { params, headers, timeout: 15000 })
    return data.results ?? []
  } catch {
    return []
  }
}

export async function scrapeMLOffers(maxPages = OFFERS_MAX_PAGES): Promise<ScrapedProduct[]> {
  if (isMLApiConfigured()) return []

  const all: ScrapedProduct[] = []
  const seen = new Set<string>()

  for (let batchStart = 1; batchStart <= maxPages; batchStart += BATCH_PARALLEL) {
    const batchEnd = Math.min(batchStart + BATCH_PARALLEL - 1, maxPages)
    const pages = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i)

    const results = await Promise.allSettled(
      pages.map(page =>
        axios.get(`https://www.mercadolivre.com.br/ofertas?page=${page}`, {
          headers: HEADERS, timeout: 20000,
        }).then(r => r.data)
      )
    )

    let foundAny = false
    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      const $ = cheerio.load(result.value)
      let count = 0
      $('.poly-card').each((_, el) => {
        const p = parsePolyCard($(el))
        if (p && !seen.has(p.productUrl)) {
          seen.add(p.productUrl)
          all.push(p)
          count++
        }
      })
      if (count > 0) foundAny = true
    }

    if (!foundAny && batchStart > 1) break

    if (batchEnd < maxPages) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES))
    }
  }

  return all
}

export async function scrapeMLByCategory(slug: string, catId?: string): Promise<ScrapedProduct[]> {
  if (isMLApiConfigured() && catId) return scrapeMLApiSearch(catId)
  return scrapeMLOffers(10)
}

export async function scrapeMLCategoryListings(catSlug: string, catName: string, maxPages = 30): Promise<ScrapedProduct[]> {
  if (isMLApiConfigured()) return scrapeMLApiSearchMulti(catSlug, catName)
  return scrapeMLOffers(maxPages)
}

export async function scrapeMLApiSearch(catId: string): Promise<ScrapedProduct[]> {
  if (!isMLApiConfigured()) return []

  const products: ScrapedProduct[] = []
  const seen = new Set<string>()
  const offsets = Array.from({ length: 20 }, (_, i) => i * 50)

  for (let batchStart = 0; batchStart < offsets.length; batchStart += BATCH_PARALLEL) {
    const batchOffsets = offsets.slice(batchStart, batchStart + BATCH_PARALLEL)

    const results = await Promise.allSettled(
      batchOffsets.map(offset =>
        fetchApiPage({ category: catId, offset, limit: 50 })
      )
    )

    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      const items = result.value
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (seen.has(item.id)) continue
        seen.add(item.id)
        const p = apiProductToScraped(item, batchOffsets[results.indexOf(result as any)] + i)
        if (p) products.push(p)
      }
    }

    if (batchStart + BATCH_PARALLEL < offsets.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES))
    }
  }

  return products
}

const SORT_ORDERS = ['relevance', 'price_desc', 'price_asc'] as const

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  celulares: ['smartphone', 'iphone', 'samsung galaxy', 'xiaomi', 'motorola', 'celular 5g', 'celular promoção', 'smartphone barato'],
  informatica: ['notebook', 'ultrabook', 'pc gamer', 'monitor', 'teclado', 'mouse', 'ssd', 'placa de video', 'processador', 'memoria ram'],
  tv: ['smart tv', 'tv 4k', 'tv oled', 'tv led', 'samsung tv', 'lg tv', 'tv promoção'],
  notebooks: ['notebook', 'notebook gamer', 'ultrabook', 'dell', 'lenovo', 'acer', 'samsung notebook', 'notebook promoção'],
  eletrodomesticos: ['geladeira', 'fogao', 'micro-ondas', 'air fryer', 'lavadora', 'freezer', 'cafeteira', 'liquidificador', 'batedeira', 'purificador'],
  fones: ['fone bluetooth', 'headset', 'fone sem fio', 'airpods', 'fone ouvido', 'fone com fio', 'headset gamer'],
  "fones-de-ouvido": ['fone bluetooth', 'headset', 'fone sem fio', 'airpods', 'fone ouvido', 'fone cancelamento'],
  games: ['playstation 5', 'xbox series', 'nintendo switch', 'jogos ps5', 'jogos xbox', 'cadeira gamer', 'headset gamer'],
  processadores: ['intel core', 'amd ryzen', 'i5', 'i7', 'ryzen 5', 'ryzen 7', 'i9', 'processador'],
  "placas-de-video": ['placa de video', 'rtx', 'gtx', 'rx', 'nvidia', 'amd placa'],
  monitores: ['monitor', 'monitor gamer', 'monitor 4k', 'monitor ultrawide', 'monitor curvo', 'monitor 144hz'],
  teclados: ['teclado mecanico', 'teclado gamer', 'teclado sem fio', 'teclado logitech', 'teclado redragon'],
  mouses: ['mouse gamer', 'mouse sem fio', 'mouse logitech', 'mouse razer', 'mousepad'],
  ssd: ['ssd 240gb', 'ssd 480gb', 'ssd 1tb', 'ssd nvme', 'ssd kingston', 'ssd crucial'],
  "memoria-ram": ['memoria ram', 'ddr4', 'ddr5', 'kingston', 'corsair', 'memoria 8gb', 'memoria 16gb'],
  geladeiras: ['geladeira frost free', 'geladeira inverse', 'geladeira consul', 'geladeira brastemp', 'refrigerador'],
  fogoes: ['fogao 4 bocas', 'fogao 5 bocas', 'fogao cooktop', 'fogao de piso', 'fogao consul'],
  "air-fryer": ['air fryer digital', 'air fryer 4l', 'air fryer 8l', 'air fryer philips', 'air fryer mondial', 'fritadeira'],
  "micro-ondas": ['micro-ondas', 'micro-ondas 30l', 'micro-ondas consul', 'micro-ondas brastemp', 'micro-ondas philco'],
  roteadores: ['roteador wifi', 'roteador mesh', 'roteador tp-link', 'roteador intelbras', 'roteador 5ghz'],
  "caixas-de-som": ['caixa de som', 'caixa de som bluetooth', 'caixa de som portatil', 'jbl', 'caixa de som potente'],
  tablets: ['tablet', 'samsung tablet', 'ipad', 'tablet android', 'tablet promoção'],
  smartwatches: ['smartwatch', 'relogio inteligente', 'apple watch', 'samsung watch', 'xiaomi watch'],
  cameras: ['camera digital', 'camera profissional', 'camera canon', 'camera nikon', 'camera sony'],
  bicicletas: ['bicicleta', 'bicicleta aro 29', 'bicicleta eletrica', 'bike', 'bicicleta infantil'],
  suplementos: ['whey protein', 'creatina', 'pré treino', 'vitamina', 'suplemento'],
  perfumes: ['perfume', 'perfume masculino', 'perfume feminino', 'colonia', 'natura', 'boticário'],
  mochilas: ['mochila', 'mochila notebook', 'mochila escolar', 'mochila viagem', 'mochila feminina'],
  pet: ['ração', 'racao cachorro', 'racao gato', 'pet', 'brinquedo pet', 'cama pet'],
  livros: ['livro', 'livro promoção', 'best seller', 'kindle', 'ebook', 'livro fisico'],
  relogios: ['relogio masculino', 'relogio feminino', 'relogio digital', 'relogio automatico', 'smartwatch'],
  sofa: ['sofa', 'sofa 3 lugares', 'sofa cama', 'sofa retratil', 'sofa sala'],
  colchoes: ['colchao', 'colchao casal', 'colchao solteiro', 'colchao queen', 'colchao ortopedico'],
  brinquedos: ['brinquedo', 'lego', 'boneca', 'carrinho', 'jogo tabuleiro', 'pelucia'],
  ferramentas: ['furadeira', 'parafusadeira', 'kit ferramentas', 'serra', 'ferramenta', 'jardim'],
  pneus: ['pneu', 'pneu aro 15', 'pneu aro 16', 'pneu 14', 'pneu 17'],
  automotivo: ['bateria automotiva', 'oleo motor', 'som automotivo', 'farol', 'acessorio carro'],
  fitness: ['esteira', 'bicicleta ergometrica', 'halter', 'yoga', 'musculacao', 'corrida'],
  audio: ['caixa de som', 'soundbar', 'home theater', 'microfone', 'violao', 'guitarra'],
  bebe: ['fralda', 'carrinho bebe', 'berco', 'cadeirinha', 'bebe'],
  casa: ['sofa', 'mesa', 'cadeira', 'estante', 'rack', 'decoracao', 'cortina', 'tapete'],
  moda: ['tenis', 'camiseta', 'jaqueta', 'calça', 'vestido', 'oculos', 'bolsa'],
  beleza: ['perfume', 'maquiagem', 'skincare', 'cabelo', 'barbeador', 'secador'],
}

function getKeywords(slug: string): string[] {
  const base = CATEGORY_KEYWORDS[slug]
  if (!base || base.length === 0) return ['']
  return base
}

export async function scrapeMLApiSearchMulti(catId: string, catSlug: string): Promise<ScrapedProduct[]> {
  if (!isMLApiConfigured()) return scrapeMLOffers(15)

  const products: ScrapedProduct[] = []
  const seen = new Set<string>()
  const queries = getKeywords(catSlug)

  const combos: { sort: string; q: string; offset: number }[] = []
  for (const sort of SORT_ORDERS) {
    for (const q of queries) {
      for (let offset = 0; offset < 1000; offset += 50) {
        combos.push({ sort, q, offset })
      }
    }
  }

  for (let batchStart = 0; batchStart < combos.length; batchStart += BATCH_PARALLEL) {
    const batch = combos.slice(batchStart, batchStart + BATCH_PARALLEL)

    const results = await Promise.allSettled(
      batch.map(({ sort, q, offset }) => {
        const params: any = { category: catId, offset, limit: 50, sort }
        if (q) params.q = q
        return fetchApiPage(params)
      })
    )

    for (let b = 0; b < results.length; b++) {
      const result = results[b]
      if (result.status !== 'fulfilled') continue
      const items = result.value
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (seen.has(item.id)) continue
        seen.add(item.id)
        const p = apiProductToScraped(item, batch[b].offset + i)
        if (p) products.push(p)
      }
    }

    if (batchStart + BATCH_PARALLEL < combos.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES))
    }
  }

  return products
}

export async function scrapeMLApiByQueries(catId: string, queries: string[], maxResults = 200): Promise<ScrapedProduct[]> {
  if (!isMLApiConfigured()) return scrapeMLOffers(15)

  const products: ScrapedProduct[] = []
  const seen = new Set<string>()

  for (let b = 0; b < queries.length; b += BATCH_PARALLEL) {
    const batch = queries.slice(b, b + BATCH_PARALLEL)

    const results = await Promise.allSettled(
      batch.map(q => {
        const params: any = { category: catId, q, offset: 0, limit: 50 }
        return fetchApiPage(params)
      })
    )

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status !== 'fulfilled') continue
      const items = result.value
      for (let j = 0; j < items.length; j++) {
        const item = items[j]
        if (seen.has(item.id)) continue
        seen.add(item.id)
        const p = apiProductToScraped(item, j)
        if (p) products.push(p)
      }
    }

    if (b + BATCH_PARALLEL < queries.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES))
    }

    if (products.length >= maxResults) break
  }

  return products.slice(0, maxResults)
}
