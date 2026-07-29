import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { searchProducts } from '../../../lib/scrapers'
import { chatWithCloudflare } from '../../../lib/cloudflare-ai'
import { checkAiRateLimit, AI_LIMIT_MESSAGE } from '../../../lib/rate-limit'
import { extractSearchParams, SearchParams } from '../../../lib/query-extractor'
import { chatWithModel, MODELS } from '../../../lib/openhauter'
import prisma from '../../../lib/prisma'

const SYSTEM_PROMPT = `Você é a DimDimIA, uma assistente ESPECIALIZADA em encontrar as MELHORES promoções e descontos em lojas brasileiras.

CAPACIDADES:
- Você tem acesso APENAS aos dados REAIS de produtos fornecidos abaixo
- Você NUNCA deve inventar ou mencionar produtos que não estão na lista
- Você ANALISA e COMPARA os resultados para recomendar o melhor custo-benefício

REGRAS:
- Responda SEMPRE em português brasileiro, de forma natural e conversacional
- NUNCA finja resultados — use APENAS os produtos da lista abaixo
- NUNCA mencione um produto que não está na lista
- Se nenhum produto da lista atender, avise honestamente

COMO ANALISAR:
1. Analise CADA produto contra o que o usuário pediu
2. Só inclua produtos que REALMENTE correspondem
3. Se o usuário pediu algo específico (ex: monitor), NÃO fale de outro tipo (ex: piso)

FORMATO OBRIGATÓRIO — siga exatamente este modelo:

Parágrafo de abertura: diga o que o usuário quer e pergunte se prefere algo diferente.
Exemplo: "Você quer exemplos de monitores baratos certo? Eu vou te passar uma lista completa dos Melhores Monitores na internet com ótimos preços. Ou você prefere que eu busque outra coisa específica?"

Linha: "Aqui está a lista dos melhores [produto] para [finalidade]:"

Para CADA produto aprovado, use este formato:

**NÚMERO. Nome do Produto [P#]**
(imagem aparecerá automaticamente aqui)
Descrição detalhada: principais especificações, por que é bom para o que o usuário pediu. Preço de R$ X por R$ Y (-Z% OFF).

Exemplo real:
**1. Monitor Samsung Odyssey G30 [P1]**
Descrição detalhada: Monitor 27 polegadas, 165Hz, 1ms, Full HD. Excelente para jogos, imagem nítida e taxa de atualização alta. Preço de R$ 1.999 por R$ 1.399 (-30% OFF).

**2. Monitor LG UltraGear [P3]**
Descrição detalhada: Monitor 24 polegadas, 144Hz, IPS, 1ms. Ótimo custo-benefício, cores vivas e ótimo para jogos competitivos. Preço de R$ 1.499 por R$ 1.199 (-20% OFF).

Importante:
- Use lista numerada (1., 2., 3.)
- O nome do produto sempre em negrito com [P#] no final
- Após o nome, escreva "Descrição detalhada:" com specs e preço
- NÃO use ##, ###, 🎯, ✅, ❌ ou outros marcadores
- Se NENHUM produto atender, avise sem inventar`

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
