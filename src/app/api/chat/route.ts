import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { searchProducts } from '../../../lib/scrapers'
import { chatWithCloudflare } from '../../../lib/cloudflare-ai'
import { checkAiRateLimit, AI_LIMIT_MESSAGE } from '../../../lib/rate-limit'
import { extractSearchParams, SearchParams } from '../../../lib/query-extractor'
import { chatWithModel, MODELS } from '../../../lib/openhauter'
import prisma from '../../../lib/prisma'

const SYSTEM_PROMPT = `Você é a DimDimIA, uma assistente ESPECIALIZADA em encontrar as MELHORES promoções e descontos em lojas brasileiras.

SUAS CAPACIDADES:
- Você tem acesso APENAS aos dados REAIS de produtos fornecidos abaixo
- Você NUNCA deve inventar, sugerir ou mencionar produtos que não estão na lista fornecida
- Você ANALISA e COMPARA os resultados fornecidos para recomendar o melhor custo-benefício

COMO ANALISAR PRODUTOS:
1. Analise CADA produto individualmente contra o que o usuário pediu
2. Só inclua produtos que REALMENTE correspondem ao que o usuário busca
3. Se o usuário pediu um tipo específico (ex: monitor), NÃO mencione produtos de outro tipo (ex: piso)

FORMATO DE RESPOSTA COM PRODUTOS:
- Explique por que cada produto atende
- Destaque o desconto real: "de R$ X por R$ Y (Z% OFF)"
- Recomende o MELHOR custo-benefício

REGRAS:
- Responda SEMPRE em português brasileiro
- NUNCA finja resultados — use APENAS os produtos reais da lista abaixo
- NUNCA mencione um produto que não está na lista
- Se não encontrar produtos relevantes na lista, avise honestamente

ANÁLISE OBRIGATÓRIA:
Da lista de produtos fornecida, selecione APENAS os TOP 5-10 que melhor atendem.
Para cada um: escreva o NOME em negrito seguido de [P#] — ex: **Monitor Samsung [P1]**.
Depois uma breve análise de por que atende.

Exemplo:
**Monitor Samsung Odyssey [P1]**
Preço: de R$ 2.499 por R$ 1.999 (-20% OFF)
🎯 Ideal para o que você pediu: monitor bom e barato, frete grátis

Se NENHUM produto da lista atender, avise: "Não encontrei produtos que atendam exatamente na busca atual."`

function buildProductList(scrapedProducts: any[]) {
  return scrapedProducts.map((p, i) => {
    const discount = p.oldPrice && p.oldPrice > p.price
      ? Math.round((1 - p.price / p.oldPrice) * 100)
      : 0
    return {
      index: i + 1,
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice || 0,
      discountPercent: discount,
      store: p.store,
      imageUrl: p.imageUrl,
      productUrl: p.productUrl,
      freeShipping: p.freeShipping || false,
      sellerName: p.sellerName || '',
      rating: p.rating || null,
      totalSales: p.totalSales || null,
      description: p.description || p.name,
    }
  })
}

async function callAi(messages: { role: string; content: string }[], systemPrompt: string): Promise<string | null> {
  const cf = await chatWithCloudflare(messages, systemPrompt)
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

    let scrapedProducts: any[] = []
    let productList: any[] = []
    let extractedParams: SearchParams | null = null

    if (isProductRequest) {
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user) {
          const rateLimit = await checkAiRateLimit(user.id)
          if (!rateLimit.allowed) {
            scrapedProducts = await searchProducts(message)
            productList = buildProductList(scrapedProducts.slice(0, 10))
            await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
            const body = productList.length > 0
              ? { response: AI_LIMIT_MESSAGE, products: productList }
              : { response: AI_LIMIT_MESSAGE, products: [] }
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
              await processChatStream(message, history, session, send, controller, encoder)
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

      extractedParams = await extractSearchParams(message)
      const searchQuery = extractedParams?.productName || message
      console.log(`[Chat] Query: "${searchQuery}"`)

      scrapedProducts = await searchProducts(searchQuery)
      productList = buildProductList(scrapedProducts)
    }

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) {
        const rateLimit = await checkAiRateLimit(user.id)
        if (!rateLimit.allowed) {
          await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
          const body = productList.length > 0
            ? { response: AI_LIMIT_MESSAGE, products: productList }
            : { response: AI_LIMIT_MESSAGE, products: [] }
          if (isStream) return streamResponse([{ event: 'result', data: body }, { event: 'done', data: {} }])
          return NextResponse.json(body)
        }
      }
    }

    if (productList.length > 0) {
      const requirements = extractedParams?.requirements
        ? `${extractedParams.productName}${extractedParams.brand ? `, ${extractedParams.brand}` : ''}${extractedParams.specs.length > 0 ? `, ${extractedParams.specs.join(', ')}` : ''}${extractedParams.maxPrice ? `, até R$ ${extractedParams.maxPrice}` : ''}`
        : ''

      const productContext = productList.map(p =>
        `P${p.index} | ${p.name} | ${p.store} | R$ ${p.price.toFixed(2)}${p.oldPrice > 0 ? ` de R$ ${p.oldPrice.toFixed(2)} (-${p.discountPercent}%)` : ''}${p.freeShipping ? ' | Frete Grátis' : ''}${p.rating ? ` | ${p.rating}/5` : ''}${p.sellerName ? ` | ${p.sellerName}` : ''} | ${p.productUrl}`
      ).join('\n')

      const messages = history || []
      messages.push({
        role: 'user',
        content: `O usuário perguntou: "${message}"

REQUISITOS: ${requirements || 'Nenhum específico'}

Total de ${productList.length} produtos reais encontrados:

${productContext}

Analise todos. Mostre APENAS os TOP 5-10 melhores que atendem. Para cada um: nome em negrito com o índice [P#], preço, desconto, e por que atende.`
      })

      const response = await callAi(messages, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde.'

      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user) {
          await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
          await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
        }
      }

      const matchedProducts = matchProductsToResponse(response, productList)
      const body = { response, products: matchedProducts.length > 0 ? matchedProducts : productList.slice(0, 10) }
      if (isStream) return streamResponse([{ event: 'result', data: body }, { event: 'done', data: {} }])
      return NextResponse.json(body)
    }

    if (isProductRequest && scrapedProducts.length === 0) {
      const messages = history || []
      messages.push({ role: 'user', content: message })
      const response = await callAi(messages, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação no momento.'

      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user) {
          await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
          await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
        }
      }

      const body = { response, products: [] }
      if (isStream) return streamResponse([{ event: 'result', data: body }, { event: 'done', data: {} }])
      return NextResponse.json(body)
    }

    const messages = history || []
    messages.push({ role: 'user', content: message })
    const response = await callAi(messages, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação no momento.'

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) {
        await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
        await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
      }
    }

    const body = { response, products: [] }
    if (isStream) return streamResponse([{ event: 'result', data: body }, { event: 'done', data: {} }])
    return NextResponse.json(body)
  } catch (error: any) {
    console.error('Chat API error:', error)
    const body = { error: 'Erro interno do servidor' }
    if (isStream) return streamResponse([{ event: 'error', data: body }, { event: 'done', data: {} }])
    return NextResponse.json(body, { status: 500 })
  }
}

async function processChatStream(
  message: string,
  history: any[],
  session: any,
  send: (event: string, data: any) => void,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  send('status', { phase: 'thinking' })
  await sleep(800)

  const extractedParams = await extractSearchParams(message)
  const searchQuery = extractedParams?.productName || message
  console.log(`[Chat] Query extraída: "${extractedParams?.productName}"`)

  send('status', { phase: 'searching' })

  const rawProducts = await searchProducts(searchQuery)
  const productList = buildProductList(rawProducts)

  send('product_count', { total: productList.length })

  send('status', { phase: 'evaluating' })
  await sleep(500)

  const requirements = extractedParams?.requirements
    ? `${extractedParams.productName}${extractedParams.brand ? `, ${extractedParams.brand}` : ''}${extractedParams.specs.length > 0 ? `, ${extractedParams.specs.join(', ')}` : ''}${extractedParams.maxPrice ? `, até R$ ${extractedParams.maxPrice}` : ''}`
    : ''

  const productContext = productList.slice(0, 200).map(p =>
    `P${p.index} | ${p.name} | ${p.store} | R$ ${p.price.toFixed(2)}${p.oldPrice > 0 ? ` de R$ ${p.oldPrice.toFixed(2)} (-${p.discountPercent}%)` : ''}${p.freeShipping ? ' | Frete Grátis' : ''}${p.rating ? ` | ${p.rating}/5` : ''} | ${p.productUrl}`
  ).join('\n')

  const msgs = history || []
  msgs.push({
    role: 'user',
    content: `O usuário perguntou: "${message}"

REQUISITOS: ${requirements || 'Nenhum específico'}

Total de ${productList.length} produtos reais encontrados (mostrando os 200 melhores):

${productContext}

Analise todos. Mostre APENAS os TOP 5-10 melhores que atendem os requisitos. Para cada um: nome em negrito com o índice [P#], preço, desconto, e por que atende.`
  })

  const response = await callAi(msgs, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação no momento.'

  const matchedProducts = matchProductsToResponse(response, productList)

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (user) {
      await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
      await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
    }
  }

  send('result', { response, products: matchedProducts.length > 0 ? matchedProducts : productList.slice(0, 10) })
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

function extractProductIndices(response: string): number[] {
  const indices = new Set<number>()
  const regex = /\[P(\d+)\]/g
  let match
  while ((match = regex.exec(response)) !== null) {
    indices.add(parseInt(match[1], 10))
  }
  return Array.from(indices).sort((a, b) => a - b)
}

function matchProductsToResponse(response: string, productList: any[]): any[] {
  const byIndex = extractProductIndices(response)
  if (byIndex.length > 0) {
    return productList.filter(p => byIndex.includes(p.index))
  }

  const responseLower = response.toLowerCase()
  const matched: any[] = []
  const seen = new Set<number>()

  for (const p of productList) {
    const nameWords = p.name.toLowerCase().split(' ').filter((w: string) => w.length > 3)
    const matchCount = nameWords.filter((w: string) => responseLower.includes(w)).length
    if (nameWords.length > 0 && matchCount / nameWords.length >= 0.3) {
      if (!seen.has(p.index)) {
        seen.add(p.index)
        matched.push(p)
      }
    }
  }

  return matched
}
