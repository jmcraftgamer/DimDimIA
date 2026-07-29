import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { chatWithCloudflare } from '../../../lib/cloudflare-ai'
import { checkAiRateLimit, AI_LIMIT_MESSAGE } from '../../../lib/rate-limit'
import { extractSearchParams } from '../../../lib/query-extractor'
import { chatWithModel, MODELS } from '../../../lib/openhauter'
import { scrapeKabum } from '../../../lib/scrapers/kabum'
import prisma from '../../../lib/prisma'
import axios from 'axios'

const MAX_PRODUCTS_TO_SHOW = 8

interface SelectedProduct {
  index: number
  name: string
  price: number
  oldPrice: number
  discountPercent: number
  store: string
  imageUrl: string
  productUrl: string
  freeShipping: boolean
  sellerName: string
  rating: number | null
  totalSales: number | null
  description: string
}

async function searchMLApi(query: string): Promise<SelectedProduct[]> {
  try {
    const { data } = await axios.get('https://api.mercadolibre.com/sites/MLB/search', {
      params: { q: query, limit: 50 },
      timeout: 10000,
    })
    if (!data?.results?.length) return []

    return data.results
      .filter((item: any) => {
        const original = item.original_price ?? item.sale_price?.regular_amount ?? 0
        return original > item.price && item.price > 0 && item.thumbnail?.startsWith('http')
      })
      .map((item: any, i: number) => {
        const original = item.original_price ?? item.sale_price?.regular_amount ?? 0
        const discount = Math.round((1 - item.price / original) * 100)
        return {
          index: i + 1,
          name: item.title,
          price: item.price,
          oldPrice: original,
          discountPercent: discount,
          store: 'Mercado Livre',
          imageUrl: item.thumbnail?.replace(/-I\.jpg/, '-O.jpg') || '',
          productUrl: item.permalink || '',
          freeShipping: item.shipping?.free_shipping ?? false,
          sellerName: item.seller?.nickname ?? '',
          rating: item.reviews?.average ?? null,
          totalSales: item.sold_quantity ?? null,
          description: item.title,
        }
      })
  } catch {
    return []
  }
}

async function searchKabumProducts(query: string): Promise<SelectedProduct[]> {
  try {
    const raw = await scrapeKabum(query)
    return raw
      .filter(p => p.imageUrl?.startsWith('http') && p.productUrl?.startsWith('http') && p.oldPrice && p.oldPrice > p.price)
      .map((p, i) => {
        const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
        return {
          index: i + 1,
          name: p.name,
          price: p.price,
          oldPrice: p.oldPrice || 0,
          discountPercent: discount,
          store: 'Kabum',
          imageUrl: p.imageUrl,
          productUrl: p.productUrl,
          freeShipping: p.freeShipping || false,
          sellerName: p.sellerName || '',
          rating: p.rating || null,
          totalSales: p.totalSales || null,
          description: p.description || p.name,
        }
      })
  } catch {
    return []
  }
}

function selectTopProducts(mlProducts: SelectedProduct[], kabumProducts: SelectedProduct[]): SelectedProduct[] {
  const all = [...mlProducts, ...kabumProducts]
  if (all.length === 0) return []

  const seen = new Set<string>()
  const unique: SelectedProduct[] = []

  for (const p of all) {
    const key = p.productUrl || p.name
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(p)
    }
  }

  unique.sort((a, b) => {
    if (b.discountPercent !== a.discountPercent) return b.discountPercent - a.discountPercent
    if ((b.totalSales || 0) !== (a.totalSales || 0)) return (b.totalSales || 0) - (a.totalSales || 0)
    return a.price - b.price
  })

  const top = unique.slice(0, MAX_PRODUCTS_TO_SHOW)
  top.forEach((p, i) => { p.index = i + 1 })
  return top
}

const SYSTEM_PROMPT = `Você é a DimDimIA, uma assistente ESPECIALIZADA em encontrar as MELHORES promoções em lojas brasileiras.

Os produtos abaixo SÃO REAIS e foram buscados agora na internet. Analise-os e escreva uma resposta seguindo o formato abaixo.

REGRAS:
- Responda em português brasileiro, natural e conversacional
- Use APENAS os produtos listados - NÃO invente nem mencione outros
- NÃO fale de produtos de categorias diferentes do que o usuário pediu
- Se nenhum produto atender, avise honestamente

FORMATO OBRIGATÓRIO:

1. Parágrafo de abertura confirmando o que o usuário quer.
Ex: "Você quer [produto] certo? Eu vou te passar uma lista com os melhores que encontrei na internet com ótimos preços."

2. Linha: "Aqui está a lista dos melhores [produto] que encontrei:"

3. Para CADA produto, use:
**NÚMERO. Nome do Produto [P#]**
Descrição detalhada: especificações, por que é bom para o que o usuário pediu. Preço de R$ X por R$ Y (-Z% OFF).

Exemplo:
**1. Monitor Samsung Odyssey G30 [P1]**
Descrição detalhada: Monitor 27 polegadas, 165Hz, 1ms, Full HD. Excelente para jogos, imagem nítida. Preço de R$ 1.999 por R$ 1.399 (-30% OFF).

Importante:
- Use lista numerada (1., 2., 3.)
- O nome em negrito com [P#] no final
- "Descrição detalhada:" com specs relevantes e preço
- NÃO use ##, ###, 🎯, ✅, ❌`

function callAi(messages: { role: string; content: string }[], systemPrompt: string): Promise<string | null> {
  const cf = chatWithCloudflare(messages, systemPrompt)
  if (cf) return cf
  return chatWithModel(MODELS.CHAT_ASSISTANT, messages, systemPrompt)
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const isStream = searchParams.get('stream') === '1'

  try {
    const session = await getServerSession()
    const { message, history } = await request.json()

    if (!message) {
      const body = { error: 'Mensagem é obrigatória' }
      return isStream
        ? streamResponse([{ event: 'error', data: body }, { event: 'done', data: {} }])
        : NextResponse.json(body, { status: 400 })
    }

    const lowercaseMsg = message.toLowerCase()
    const isProductRequest =
      lowercaseMsg.includes('quero') || lowercaseMsg.includes('busque') ||
      lowercaseMsg.includes('encontre') || lowercaseMsg.includes('procure') ||
      lowercaseMsg.includes('pesquise') || lowercaseMsg.includes('preço') ||
      lowercaseMsg.includes('preco') || lowercaseMsg.includes('promoção') ||
      lowercaseMsg.includes('promocao') || lowercaseMsg.includes('barato') ||
      lowercaseMsg.includes('melhor') || lowercaseMsg.includes('comprar') ||
      lowercaseMsg.includes('quanto custa') || lowercaseMsg.includes('qual o preço') ||
      lowercaseMsg.includes('recomende') || lowercaseMsg.includes('sugira') ||
      lowercaseMsg.includes('indique') || lowercaseMsg.includes('mostre') ||
      lowercaseMsg.includes('vale a pena') || lowercaseMsg.includes('compensa') ||
      lowercaseMsg.includes('desconto') || lowercaseMsg.includes('oferta') ||
      lowercaseMsg.includes('gostaria') || lowercaseMsg.includes('preciso') ||
      lowercaseMsg.includes('dica') || lowercaseMsg.includes('qual') ||
      lowercaseMsg.includes('onde')

    if (!isProductRequest) {
      const messages = history || []
      messages.push({ role: 'user', content: message })
      const response = await callAi(messages, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação.'
      const body = { response, products: [] }
      if (isStream) return streamResponse([{ event: 'result', data: body }, { event: 'done', data: {} }])
      return NextResponse.json(body)
    }

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) {
        const rateLimit = await checkAiRateLimit(user.id)
        if (!rateLimit.allowed) {
          await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
          const body = { response: AI_LIMIT_MESSAGE, products: [] }
          if (isStream) return streamResponse([{ event: 'result', data: body }, { event: 'done', data: {} }])
          return NextResponse.json(body)
        }
      }
    }

    if (isStream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          const send = (event: string, data: any) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
          }
          try {
            await processChatStream(message, history, session, send)
          } catch (err: any) {
            console.error('Chat stream error:', err)
            send('error', { message: 'Erro interno do servidor' })
          } finally {
            send('done', {})
            controller.close()
          }
        },
      })
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    return handleNonStream(message, history, session)
  } catch (error: any) {
    console.error('Chat API error:', error)
    const body = { error: 'Erro interno do servidor' }
    if (isStream) return streamResponse([{ event: 'error', data: body }, { event: 'done', data: {} }])
    return NextResponse.json(body, { status: 500 })
  }
}

async function searchAndSelectProducts(query: string): Promise<SelectedProduct[]> {
  const [mlProducts, kabumProducts] = await Promise.all([
    searchMLApi(query),
    searchKabumProducts(query),
  ])
  return selectTopProducts(mlProducts, kabumProducts)
}

async function handleNonStream(message: string, history: any[], session: any) {
  const extractedParams = await extractSearchParams(message)
  const searchQuery = extractedParams?.productName || message

  const selectedProducts = await searchAndSelectProducts(searchQuery)

  if (session?.user?.email) {
    await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: session.user.email } }).catch(() => {})
  }

  if (selectedProducts.length === 0) {
    const msgs = history || []
    msgs.push({ role: 'user', content: message })
    const response = await callAi(msgs, SYSTEM_PROMPT) || 'Desculpe, não consegui encontrar produtos para sua busca.'
    const body = { response, products: [] }
    return NextResponse.json(body)
  }

  const requirements = extractedParams?.requirements || ''
  const productContext = selectedProducts.map(p =>
    `P${p.index} | ${p.name} | ${p.store} | R$ ${p.price.toFixed(2)}${p.oldPrice > 0 ? ` de R$ ${p.oldPrice.toFixed(2)} (-${p.discountPercent}%)` : ''}${p.freeShipping ? ' | Frete Grátis' : ''}${p.rating ? ` | ${p.rating}/5` : ''} | ${p.productUrl}`
  ).join('\n')

  const msgs = history || []
  msgs.push({
    role: 'user',
    content: `O usuário perguntou: "${message}"
REQUISITOS: ${requirements || 'Nenhum'}
PRODUTOS ENCONTRADOS (${selectedProducts.length}):
${productContext}
Analise APENAS esses produtos acima. Descreva cada um no formato solicitado.`
  })

  const response = await callAi(msgs, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação.'

  if (session?.user?.email) {
    await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: session.user.email } }).catch(() => {})
  }

  const body = { response, products: selectedProducts }
  return NextResponse.json(body)
}

async function processChatStream(
  message: string,
  history: any[],
  session: any,
  send: (event: string, data: any) => void
) {
  send('status', { phase: 'thinking' })
  await sleep(800)

  const extractedParams = await extractSearchParams(message)
  const searchQuery = extractedParams?.productName || message

  send('status', { phase: 'searching' })

  const selectedProducts = await searchAndSelectProducts(searchQuery)

  send('product_count', { total: selectedProducts.length })

  if (selectedProducts.length === 0) {
    const msgs = history || []
    msgs.push({ role: 'user', content: message })
    const response = await callAi(msgs, SYSTEM_PROMPT) || 'Desculpe, não encontrei produtos para sua busca.'
    send('result', { response, products: [] })
    return
  }

  send('status', { phase: 'evaluating' })
  await sleep(500)

  const requirements = extractedParams?.requirements || ''
  const productContext = selectedProducts.map(p =>
    `P${p.index} | ${p.name} | ${p.store} | R$ ${p.price.toFixed(2)}${p.oldPrice > 0 ? ` de R$ ${p.oldPrice.toFixed(2)} (-${p.discountPercent}%)` : ''}${p.freeShipping ? ' | Frete Grátis' : ''}${p.rating ? ` | ${p.rating}/5` : ''} | ${p.productUrl}`
  ).join('\n')

  const msgs = history || []
  msgs.push({
    role: 'user',
    content: `O usuário perguntou: "${message}"
REQUISITOS: ${requirements || 'Nenhum'}
PRODUTOS ENCONTRADOS (${selectedProducts.length}):
${productContext}
Analise APENAS esses produtos acima. Descreva cada um no formato solicitado.`
  })

  const response = await callAi(msgs, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação.'

  if (session?.user?.email) {
    await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: session.user.email } }).catch(() => {})
    await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: session.user.email } }).catch(() => {})
  }

  send('result', { response, products: selectedProducts })
}

function streamResponse(events: { event: string; data: any }[]) {
  const encoder = new TextEncoder()
  const body = events.map(e => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join('')
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
