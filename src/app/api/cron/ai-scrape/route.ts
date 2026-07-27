import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { scrapeMLApiByQueries } from '../../../../lib/scrapers/mercadolivre-api'
import { MLB_CATEGORIES, MLBCategory } from '../../../../lib/scrapers/mercadolivre-api'
import { callOpenRouter } from '../../../../lib/ai-agent'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

const AGENTS = 2
const CATS_PER = 2
const QUERIES_PER = 4

const FALLBACK_QUERIES: Record<string, string[]> = {
  celulares: ['iphone', 'samsung galaxy', 'xiaomi', 'motorola'],
  notebooks: ['notebook', 'ultrabook', 'notebook gamer', 'dell'],
  informatica: ['notebook', 'placa de video', 'ssd', 'monitor'],
  tv: ['smart tv', 'tv 4k', 'tv oled', 'samsung tv'],
  games: ['playstation 5', 'xbox series', 'nintendo switch', 'cadeira gamer'],
  eletrodomesticos: ['geladeira', 'air fryer', 'micro-ondas', 'fogao'],
  fones: ['fone bluetooth', 'headset', 'airpods', 'fone sem fio'],
  moda: ['tenis', 'camiseta', 'jaqueta', 'relogio'],
  casa: ['sofa', 'cadeira', 'colchao', 'mesa'],
  pet: ['racao', 'brinquedo pet', 'cama pet', 'coleira'],
  audio: ['caixa de som', 'soundbar', 'home theater', 'microfone'],
  ferramentas: ['furadeira', 'parafusadeira', 'kit ferramentas', 'serra'],
  automotivo: ['bateria automotiva', 'oleo motor', 'som automotivo', 'pneu'],
  livros: ['livro', 'best seller', 'romance', 'quadrinhos'],
  esportes: ['bicicleta', 'esteira', 'suplemento', 'skate'],
  instrumentos: ['violao', 'guitarra', 'teclado', 'bateria'],
  saude: ['vitamina', 'whey', 'creatina', 'termogenico'],
  cozinha: ['panela', 'jogo panelas', 'talheres', 'copo'],
  decoracao: ['quadro', 'vaso', 'luminaria', 'tapete'],
  moveis: ['sofa', 'mesa', 'estante', 'rack'],
  brinquedos: ['lego', 'boneca', 'carrinho', 'jogo tabuleiro'],
  relogios: ['relogio masculino', 'relogio feminino', 'smartwatch', 'apple watch'],
  cameras: ['camera digital', 'canon', 'nikon', 'camera seguranca'],
  pneus: ['pneu aro 15', 'pneu aro 16', 'pneu aro 17', 'pneu 14'],
}

function getFallbackQueries(slug: string): string[] {
  const exact = FALLBACK_QUERIES[slug]
  if (exact) return exact

  const readable = slug.replace(/-/g, ' ')
  const first = readable.split(' ')[0]
  if (first && first.length > 2) {
    return [readable, `${readable} promoção`, first, `${first} promoção`]
  }
  return ['promocao', 'oferta', 'desconto']
}

const AI_PROMPT = `Você é um especialista em promoções do Mercado Livre Brasil.
Gere ${QUERIES_PER} queries de busca em português para encontrar produtos EM PROMOÇÃO na categoria abaixo.
Retorne APENAS as queries, uma por linha, sem numeração.`

function shufflePick<T>(arr: T[], n: number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

async function runAgent(agentId: number, categories: MLBCategory[], deadline: number): Promise<{ saved: number; log: string }> {
  let total = 0
  const catNames = categories.map(c => c.name).join(', ')

  for (const cat of categories) {
    if (Date.now() > deadline) {
      return { saved: total, log: `Agent ${agentId} [${catNames}]: ${total} (timeout)` }
    }

    let queries: string[] = []
    const aiRes = await callOpenRouter(AI_PROMPT, `Categoria: ${cat.name}`)
    if (aiRes) {
      queries = aiRes.split('\n').map(l => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(l => l.length > 3).slice(0, QUERIES_PER)
    }
    if (queries.length === 0) {
      queries = getFallbackQueries(cat.slug).slice(0, QUERIES_PER)
    }

    if (Date.now() > deadline) break
    let products = await scrapeMLApiByQueries(cat.id, queries, 30)
    if (products.length === 0) {
      products = await scrapeMLApiByQueries(cat.id, ['promocao', 'oferta', 'desconto'], 20)
    }
    total += products.length
  }

  return { saved: total, log: `Agent ${agentId} [${catNames}]: ${total}` }
}

export async function GET() {
  const startTime = Date.now()
  const deadline = startTime + 8000

  try {
    const selected = shufflePick(MLB_CATEGORIES, AGENTS * CATS_PER)
    const groups: MLBCategory[][] = []
    for (let i = 0; i < AGENTS; i++) {
      groups.push(selected.slice(i * CATS_PER, (i + 1) * CATS_PER))
    }

    const results = await Promise.all(groups.map((g, i) => runAgent(i, g, deadline)))
    const totalSaved = results.reduce((s, r) => s + r.saved, 0)
    const activeProducts = await prisma.product.count({ where: { isActive: true } })

    return NextResponse.json({
      success: true,
      type: 'ai',
      logs: results.map(r => r.log),
      totalSaved,
      activeProducts,
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, elapsedMs: Date.now() - startTime })
  }
}
