import axios from 'axios'
import prisma from './prisma'
import { ScrapedProduct } from '../types'
import { scrapeMLApiByQueries } from './scrapers/mercadolivre-api'
import { MLB_CATEGORIES, MLBCategory } from './scrapers/mercadolivre-api'
import { checkSeller } from './whitelist'

const OPENROUTER_API_KEY = process.env.OPENHAUTER_API_KEY || ''
const OPENROUTER_URL = process.env.OPENHAUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'

export const AGENTS_COUNT = 10

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function divideCategoriesIntoGroups(count: number): { groupName: string; categories: MLBCategory[] }[] {
  const shuffled = shuffleArray(MLB_CATEGORIES)
  const groups: { groupName: string; categories: MLBCategory[] }[] = []
  const perGroup = Math.ceil(shuffled.length / count)

  for (let i = 0; i < count; i++) {
    const cats = shuffled.slice(i * perGroup, (i + 1) * perGroup)
    if (cats.length === 0) continue
    const groupName = cats.map(c => c.name).slice(0, 3).join(', ') + (cats.length > 3 ? ` +${cats.length - 3}` : '')
    groups.push({ groupName, categories: cats })
  }

  return groups
}

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data } = await axios.post(
        OPENROUTER_URL,
        {
          model: 'openai/gpt-oss-20b:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://dimdimia.app',
            'X-Title': 'DimDimIA',
          },
          timeout: 30000,
        }
      )
      return data.choices?.[0]?.message?.content || null
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 429) {
        const wait = 2000 * (attempt + 1)
        await new Promise(r => setTimeout(r, wait))
        continue
      }
      if (attempt === 2) return null
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return null
}

const SYSTEM_PROMPT_GENERATE_QUERIES = `Você é um especialista em encontrar promoções no Mercado Livre Brasil.
Sua função é gerar queries de busca específicas que maximizem a chance de encontrar produtos COM DESCONTO REAL.

REGRAS:
- Gere queries em português brasileiro
- Sejam específicas (marca + modelo + categoria)
- Incluam variações como "promoção", "barato", "desconto"
- Cubram diferentes marcas e faixas de preço
- Cada query deve ser uma busca realista no Mercado Livre

Retorne APENAS as queries, uma por linha. Mínimo 8 queries, máximo 12.`

function buildProductId(store: string, productUrl: string, name: string): string {
  if (productUrl) {
    const cleanUrl = productUrl.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 60)
    return `${store}-${cleanUrl}`
  }
  return `${store}-${name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40)}`
}

async function saveOrGetSeller(sellerName: string, store: string): Promise<string | null> {
  if (!sellerName || sellerName === store) return null
  const lower = sellerName.toLowerCase()
  let seller = await prisma.seller.findFirst({ where: { name: lower, store } })
  if (seller) return seller.id
  const check = checkSeller(sellerName, store)
  seller = await prisma.seller.create({
    data: { name: lower, store, isVerified: check.isSafe, isKnownBrand: check.reason.includes('Marca conhecida') },
  })
  return seller.id
}

function calcDesirability(discount: number, position?: number): number {
  const popularityBoost = position !== undefined ? Math.max(0, 1 - position / 1000) * 60 : 0
  return Math.round(discount * 0.4 + popularityBoost)
}

export interface AgentResult {
  agentId: number
  groupName: string
  queriesGenerated: number
  productsFound: number
  error?: string
}

async function saveProduct(p: ScrapedProduct, catSlug: string, subName: string): Promise<boolean> {
  if (!p.name || p.price <= 0) return false
  if (!p.oldPrice || p.oldPrice <= p.price) return false
  const discount = Math.round((1 - p.price / p.oldPrice) * 100)
  if (discount < 5) return false
  if ((p.availableQuantity ?? 0) < 50) return false
  const desirability = calcDesirability(discount, p.position)

  try {
    const id = buildProductId(p.store, p.productUrl, p.name)
    const existing = await prisma.product.findUnique({ where: { id } })
    const sellerId = await saveOrGetSeller(p.sellerName || p.store, p.store).catch(() => null)

    if (existing) {
      await prisma.product.update({
        where: { id },
        data: {
          price: p.price, oldPrice: p.oldPrice ?? existing.oldPrice,
          rating: p.rating ?? existing.rating,
          totalSales: p.totalSales ?? existing.totalSales,
          freeShipping: p.freeShipping ?? existing.freeShipping,
          category: catSlug, subcategory: subName,
          isActive: true, isPromoted: true,
          sellerId: sellerId ?? existing.sellerId,
          score: desirability, position: p.position ?? existing.position,
          reason: `${discount}% OFF`,
          lastVerified: new Date(),
        },
      })
    } else {
      await prisma.product.create({
        data: {
          id, name: p.name, description: p.description || p.name,
          price: p.price, oldPrice: p.oldPrice ?? null,
          category: catSlug, subcategory: subName, store: p.store,
          imageUrl: p.imageUrl || 'https://via.placeholder.com/200',
          productUrl: p.productUrl || '',
          rating: p.rating ?? null, totalSales: p.totalSales ?? null,
          freeShipping: p.freeShipping ?? null,
          isActive: true, isPromoted: true,
          inStock: true, sellerId: sellerId ?? null,
          score: desirability, position: p.position ?? null,
          reason: `${discount}% OFF`,
          lastVerified: new Date(),
        },
      })
    }
    return true
  } catch { return false }
}

export async function runAgent(
  agentId: number,
  groupName: string,
  categories: MLBCategory[]
): Promise<AgentResult> {
  const catNames = categories.map(c => `${c.name} (${c.slug})`).join(', ')
  const userPrompt = `Categoria(s): ${catNames}\n\nGere 10 queries de busca específicas para essas categorias.`

  const response = await callOpenRouter(SYSTEM_PROMPT_GENERATE_QUERIES, userPrompt)
  if (!response) {
    return { agentId, groupName, queriesGenerated: 0, productsFound: 0, error: 'Falha ao gerar queries' }
  }

  const queries = response
    .split('\n')
    .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(l => l.length > 5)

  if (queries.length === 0) {
    return { agentId, groupName, queriesGenerated: 0, productsFound: 0, error: 'Nenhuma query válida' }
  }

  let totalSaved = 0
  for (const cat of categories) {
    const products = await scrapeMLApiByQueries(cat.id, queries, 50)
    for (const p of products) {
      const saved = await saveProduct(p, cat.slug, cat.name)
      if (saved) totalSaved++
    }
  }

  return {
    agentId,
    groupName,
    queriesGenerated: queries.length,
    productsFound: totalSaved,
  }
}
