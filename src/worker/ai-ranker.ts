import { ScrapedProduct } from '../types'
import { chatWithJSON, MODELS, SYSTEM_PROMPTS } from '../lib/openhauter'

interface RankedProduct extends ScrapedProduct {
  score: number
  reason: string
}

interface RankerResult {
  top5: RankedProduct[]
  raw: string
}

export async function rankProducts(
  products: ScrapedProduct[],
  categoryName: string,
  subcategoryName: string
): Promise<RankerResult> {
  if (products.length === 0) {
    return { top5: [], raw: 'Nenhum produto encontrado' }
  }

  const productsJSON = JSON.stringify(
    products.map((p, i) => ({
      index: i + 1,
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice || null,
      store: p.store,
      rating: p.rating || null,
      totalSales: p.totalSales || null,
      freeShipping: p.freeShipping || false,
      coupon: p.coupon || null,
      couponCode: p.couponCode || null,
      tax: p.tax || null,
      imageUrl: p.imageUrl,
      productUrl: p.productUrl,
    })),
    null,
    2
  )

  const systemPrompt = `${SYSTEM_PROMPTS.PRODUCT_SEARCH}

CATEGORIA: ${categoryName}
SUBCATEGORIA: ${subcategoryName}

Analise estes ${products.length} produtos encontrados e retorne os TOP 5.`

  const result = await chatWithJSON<RankedProduct[]>(
    MODELS.PRODUCT_SEARCH,
    [{ role: 'user', content: `Aqui estão os produtos para analisar:\n\n${productsJSON}` }],
    systemPrompt
  )

  if (!result || !Array.isArray(result) || result.length === 0) {
    return {
      top5: products.slice(0, 5).map((p, i) => ({
        ...p,
        score: 100 - i * 20,
        reason: 'Selecionado por padrão (IA indisponível)',
      })),
      raw: 'Falha ao ranquear com IA, usando fallback por preço',
    }
  }

  const top5: RankedProduct[] = result.slice(0, 5).map((r: any) => {
    const original = products.find(
      (p) =>
        p.name === r.name ||
        p.productUrl === r.productUrl ||
        (p.name.includes(r.name.substring(0, 30)) && p.store === r.store)
    )
    return {
      name: r.name || original?.name || '',
      description: r.description || original?.description || '',
      price: r.price ?? original?.price ?? 0,
      oldPrice: r.oldPrice ?? original?.oldPrice ?? null,
      store: r.store || original?.store || '',
      imageUrl: r.imageUrl || original?.imageUrl || '',
      productUrl: r.productUrl || original?.productUrl || '',
      rating: r.rating ?? original?.rating ?? null,
      totalSales: r.totalSales ?? original?.totalSales ?? null,
      freeShipping: r.freeShipping ?? original?.freeShipping ?? false,
      coupon: r.coupon ?? original?.coupon ?? null,
      couponCode: r.couponCode ?? original?.couponCode ?? null,
      tax: r.tax ?? original?.tax ?? null,
      score: r.score ?? 50,
      reason: r.reason || '',
    }
  })

  return { top5, raw: JSON.stringify(result) }
}
