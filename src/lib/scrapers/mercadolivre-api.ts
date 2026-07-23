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

export async function scrapeMLByCategory(
  slug: string,
  catId?: string
): Promise<ScrapedProduct[]> {
  if (!catId) return []

  const url = `https://www.mercadolivre.com.br/ofertas?page=1`

  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20000 })
    const $ = cheerio.load(data)
    const products: ScrapedProduct[] = []

    $('.poly-card').each((_, el) => {
      const $el = $(el)

      const link = $el.find('.poly-component__title-wrapper a').first().attr('href')
      if (!link || !link.includes('mercadolivre')) return

      const name = $el.find('.poly-component__title').first().text().trim()
      if (!name) return

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

      if (!oldPrice || oldPrice <= price || !price) return

      const seller = $el.find('.poly-component__seller').first().text().trim()
      const freeShipping = $el.text().toLowerCase().includes('frete grátis') || $el.text().toLowerCase().includes('frete gratis')

      products.push({
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
      })
    })

    return products
  } catch (err: any) {
    console.error(`[ML-Ofertas] ${catId} error: ${err.message}`)
    return []
  }
}

export async function scrapeMLSearch(query: string): Promise<ScrapedProduct[]> {
  return scrapeMLByCategory('busca')
}
