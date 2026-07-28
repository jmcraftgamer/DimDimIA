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
- Você tem acesso a dados REAIS de produtos de várias lojas (Mercado Livre, Amazon, Kabum, AliExpress, Shopee, Pichau, Terabyte)
- Você recebe resultados de busca REAIS sempre que o usuário pede produtos
- Você ANALISA e COMPARA os resultados para recomendar o melhor custo-benefício

COMO ANALISAR PRODUTOS:
1. O usuário vai enviar REQUISITOS específicos (marca, specs, preço, performance)
2. Você deve analisar CADA produto individualmente contra esses requisitos
3. Só inclua produtos que REALMENTE atendem os requisitos
4. Se o usuário pediu marca X, só mostre produtos da marca X
5. Se o usuário pediu preço até X, só mostre produtos até X (ou muito próximos)
6. Se o usuário pediu especificações (DDR5, 32GB, SSD), verifique se o produto tem

FORMATO DE RESPOSTA COM PRODUTOS:
- Explique por que cada produto atende os requisitos do usuário
- Destaque o desconto real: "de R$ X por R$ Y (Z% OFF)"
- Mencione frete grátis, avaliações quando disponíveis
- Compare produtos similares entre lojas diferentes
- Recomende o MELHOR custo-benefício explicando o porquê
- Se NENHUM produto atender, avise honestamente e mostre os mais próximos

REGRAS:
- Responda SEMPRE em português brasileiro
- Seja natural e conversacional, mas INFORMATIVA
- NUNCA finja resultados — use apenas os dados reais que recebeu
- Se não encontrar produtos relevantes, avise honestamente

ANÁLISE OBRIGATÓRIA DE REQUISITOS:
Você receberá MUITOS produtos (até 500). Analise todos, mas na resposta:
- Mostre apenas os TOP 5-10 melhores produtos que atendem os requisitos
- Para cada produto aprovado, escreva o NOME DO PRODUTO em negrito, depois uma breve análise de por que ele atende
- Se menos de 5 produtos atenderem, mostre apenas os que atendem
- Se NENHUM atender, avise honestamente e mostre os 3 mais próximos

Exemplo de formato para CADA produto aprovado:
**RTX 3060 12GB - Kabum**
Preço: de R$ 2.499 por R$ 1.999 (-20% OFF)
🎯 Atende porque: tem RTX 3060 que roda GTA 5 no Ultra, frete grátis, dentro do orçamento

Faça uma análise sincera. Não invente informações. Use APENAS os dados recebidos.`

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

Analise todos. Mostre APENAS os TOP 5-10 melhores que atendem. Para cada um: nome em negrito, preço, desconto, e por que atende.`
      })

      const response = await callAi(messages, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde.'

      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user) {
          await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
          await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
        }
      }

      const body = { response, products: productList }
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

Analise todos. Mostre APENAS os TOP 5-10 melhores que atendem os requisitos. Para cada um: nome em negrito, preço, desconto, e por que atende.`
  })

  const response = await callAi(msgs, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação no momento.'

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (user) {
      await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
      await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
    }
  }

  send('result', { response, products: productList.slice(0, 20) })
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
