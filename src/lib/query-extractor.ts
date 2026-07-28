import { chatWithCloudflare } from './cloudflare-ai'
import { chatWithModel, MODELS } from './openhauter'

export interface SearchParams {
  productName: string
  brand: string | null
  specs: string[]
  minPrice: number | null
  maxPrice: number | null
  requirements: string
}

const EXTRACTION_PROMPT = `Analise a mensagem do usuário e extraia informações de busca de produto. Retorne APENAS UM JSON válido, sem formatação extra, sem markdown, sem código.

Campos do JSON:
- "productName": o nome/base do produto que ele quer comprar (ex: "notebook gamer", "PC montado", "geladeira frost free", "tênis de corrida"). Seja específico mas remova palavras como "quero", "comprar", "melhor", "barato".
- "brand": a marca específica mencionada (ex: "Samsung", "Dell", "NVIDIA", "Pichau"), ou null se não houver.
- "specs": array de especificações/requisitos mencionados (ex: ["DDR5", "32GB RAM", "roda GTA 5 no ultra", "SSD 1TB", "4K"]). Se vazio, coloque [].
- "minPrice": preço mínimo mencionado como número (ex: 1000), ou null.
- "maxPrice": preço máximo mencionado como número (ex: 5000), ou null.
- "requirements": descrição resumida de TODOS os requisitos do usuário (ex: "roda GTA 5 no Ultra, até R$ 5000, DDR5, 32GB RAM").`

export async function extractSearchParams(userMessage: string): Promise<SearchParams | null> {
  try {
    let content: string | null = null

    const cf = await chatWithCloudflare(
      [{ role: 'user', content: userMessage }],
      EXTRACTION_PROMPT
    )
    if (cf) content = cf

    if (!content) {
      content = await chatWithModel(MODELS.CHAT_ASSISTANT, [
        { role: 'user', content: userMessage }
      ], EXTRACTION_PROMPT)
    }

    if (!content) return null

    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*$/g, '')
      .trim()

    const parsed = JSON.parse(cleaned)
    return {
      productName: parsed.productName || '',
      brand: parsed.brand || null,
      specs: Array.isArray(parsed.specs) ? parsed.specs : [],
      minPrice: parsed.minPrice || null,
      maxPrice: parsed.maxPrice || null,
      requirements: parsed.requirements || '',
    }
  } catch {
    return null
  }
}
