import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedProduct } from '../../types'

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

export async function scrapeMLByCategory(slug: string, catId?: string): Promise<ScrapedProduct[]> {
  if (!catId) return []

  const catIdx = MLB_CATEGORIES.findIndex(c => c.id === catId)
  const page = (catIdx % 20) + 1
  const url = `https://www.mercadolivre.com.br/ofertas?page=${page}`

  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20000 })
    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []

    $('.poly-card').each((_, el) => {
      const p = parsePolyCard($(el))
      if (p) products.push(p)
    })

    return products
  } catch (err: any) {
    console.error(`[ML-Ofertas] ${catId} error: ${err.message}`)
    return []
  }
}

export async function scrapeMLCategoryListings(catSlug: string, catName: string, maxPages = 30): Promise<ScrapedProduct[]> {
  const allProducts: ScrapedProduct[] = []
  const seen = new Set<string>()

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `https://www.mercadolivre.com.br/c/${catSlug}?page=${page}`
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 20000 })
      const $ = cheerio.load(data)
      let found = 0

      $('.poly-card').each((_, el) => {
        const p = parsePolyCard($(el))
        if (p && !seen.has(p.productUrl)) {
          seen.add(p.productUrl)
          allProducts.push(p)
          found++
        }
      })

      if (found === 0) break

      await new Promise(r => setTimeout(r, 500))
    } catch (err: any) {
      console.error(`[ML-Listings] ${catSlug} page ${page}: ${err.message}`)
      break
    }
  }

  return allProducts
}

export async function scrapeMLApiSearch(catId: string): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = []
  const seen = new Set<string>()

  for (let offset = 0; offset < 1000; offset += 50) {
    try {
      const { data } = await axios.get(API_BASE, {
        params: { category: catId, offset, limit: 50 },
        timeout: 15000,
      })

      if (!data.results?.length) break

      for (let i = 0; i < data.results.length; i++) {
        const item = data.results[i]
        if (seen.has(item.id)) continue
        seen.add(item.id)

        const originalPrice = item.original_price ?? item.sale_price?.regular_amount ?? null
        if (!originalPrice || originalPrice <= item.price) continue

        const discount = Math.round((1 - item.price / originalPrice) * 100)
        if (discount < 5) continue

        products.push({
          name: item.title,
          description: item.title,
          price: item.price,
          oldPrice: originalPrice,
          store: 'Mercado Livre',
          imageUrl: item.thumbnail?.replace(/-I\.jpg/, '-O.jpg') ?? '',
          productUrl: item.permalink ?? '',
          freeShipping: item.shipping?.free_shipping ?? false,
          sellerName: item.seller?.nickname ?? '',
          inStock: item.available_quantity > 0,
          position: offset + i,
        })
      }

      await new Promise(r => setTimeout(r, 300))
    } catch (err: any) {
      console.error(`[ML-API] ${catId} offset ${offset}: ${err.message}`)
      break
    }
  }

  return products
}

const SORT_ORDERS = ['relevance', 'price_desc', 'price_asc'] as const

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'celulares': ['smartphone', 'iphone', 'samsung', 'xiaomi', 'motorola'],
  'tv': ['smart tv', 'oled', '4k', 'led tv', 'samsung tv'],
  'notebooks': ['notebook', 'ultrabook', 'gamer notebook', 'dell', 'lenovo'],
  'fones-de-ouvido': ['fone bluetooth', 'headset', 'fone sem fio', 'airpods'],
  'processadores': ['intel core', 'amd ryzen', 'i5', 'i7', 'ryzen 7'],
  'geladeiras': ['geladeira frost free', 'refrigerador', 'consul', 'brastemp'],
  'fogoes': ['fogão 4 bocas', 'fogão cooktop', 'fogão de piso'],
  'air-fryer': ['air fryer digital', 'fritadeira', 'air fryer philips'],
  'monitores': ['monitor gamer', 'monitor 4k', 'monitor ultrawide'],
  'teclados': ['teclado gamer', 'teclado mecanico', 'teclado sem fio'],
  'mouses': ['mouse gamer', 'mouse sem fio', 'mouse logitech'],
  'ssd': ['ssd 480gb', 'ssd 1tb', 'ssd nvme', 'ssd kingston'],
}

export async function scrapeMLApiSearchMulti(catId: string, catSlug: string): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = []
  const seen = new Set<string>()

  const queries = CATEGORY_KEYWORDS[catSlug] ?? ['']

  for (const sort of SORT_ORDERS) {
    for (const q of queries) {
      for (let offset = 0; offset < 1000; offset += 50) {
        try {
          const params: any = { category: catId, offset, limit: 50, sort }
          if (q) params.q = q

          const { data } = await axios.get(API_BASE, { params, timeout: 15000 })
          if (!data.results?.length) break

          for (let i = 0; i < data.results.length; i++) {
            const item = data.results[i]
            if (seen.has(item.id)) continue
            seen.add(item.id)

            const originalPrice = item.original_price ?? item.sale_price?.regular_amount ?? null
            if (!originalPrice || originalPrice <= item.price) continue

            const discount = Math.round((1 - item.price / originalPrice) * 100)
            if (discount < 5) continue

            products.push({
              name: item.title,
              description: item.title,
              price: item.price,
              oldPrice: originalPrice,
              store: 'Mercado Livre',
              imageUrl: item.thumbnail?.replace(/-I\.jpg/, '-O.jpg') ?? '',
              productUrl: item.permalink ?? '',
              freeShipping: item.shipping?.free_shipping ?? false,
              sellerName: item.seller?.nickname ?? '',
              inStock: item.available_quantity > 0,
              position: offset + i,
            })
          }

          await new Promise(r => setTimeout(r, 300))
        } catch {
          break
        }
      }
    }
  }

  return products
}
