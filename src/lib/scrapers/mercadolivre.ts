import { ScrapedProduct } from '../../types'
import { scrapeMLSearch } from './mercadolivre-api'

export async function scrapeMercadoLivre(query: string, skipApify?: boolean): Promise<ScrapedProduct[]> {
  return scrapeMLSearch(query)
}
