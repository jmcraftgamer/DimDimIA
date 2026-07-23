import { ScrapedProduct } from '../../types'
import { scrapeMLByCategory } from './mercadolivre-api'

export async function scrapeMercadoLivre(query: string, skipApify?: boolean): Promise<ScrapedProduct[]> {
  return scrapeMLByCategory('geral')
}
