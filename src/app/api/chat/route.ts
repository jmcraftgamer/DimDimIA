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
Sempre que receber produtos, analise cada um contra os requisitos do usuário.
Exemplo: usuário pediu "PC que roda GTA 5 no Ultra, até R$ 5000"
- PC #1: RTX 3060 + R$ 4500 → ATENDE (roda GTA Ultra, dentro do orçamento) ✓
- PC #2: GTX 1650 + R$ 3200 → NÃO ATENDE (não roda GTA Ultra) ✗
- PC #3: RTX 4070 + R$ 8000 → NÃO ATENDE (acima do orçamento) ✗`

async function callAi(messages: { role: string; content: string }[], systemPrompt: string): Promise<string | null> {
  const cf = await chatWithCloudflare(messages, systemPrompt)
  if (cf) return cf
  return chatWithModel(MODELS.CHAT_ASSISTANT, messages, systemPrompt)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
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

            if (productList.length > 0) {
              return NextResponse.json({ response: AI_LIMIT_MESSAGE, products: productList })
            }
            return NextResponse.json({ response: AI_LIMIT_MESSAGE, products: [] })
          }
        }
      }

      extractedParams = await extractSearchParams(message)

      const searchQuery = extractedParams?.productName || message
      console.log(`[Chat] Query extraída: "${extractedParams?.productName}" | Buscando: "${searchQuery}"`)

      scrapedProducts = await searchProducts(searchQuery)
      scrapedProducts = scrapedProducts.slice(0, 25)

      productList = scrapedProducts.map((p, i) => {
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

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) {
        const rateLimit = await checkAiRateLimit(user.id)
        if (!rateLimit.allowed) {
          await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })

          if (productList.length > 0) {
            return NextResponse.json({ response: AI_LIMIT_MESSAGE, products: productList })
          }
          return NextResponse.json({ response: AI_LIMIT_MESSAGE, products: [] })
        }
      }
    }

    if (productList.length > 0) {
      const requirements = extractedParams?.requirements
        ? `\n\nREQUISITOS DO USUÁRIO:\n- Produto: ${extractedParams.productName}${extractedParams.brand ? `\n- Marca: ${extractedParams.brand}` : ''}${extractedParams.specs.length > 0 ? `\n- Especificações: ${extractedParams.specs.join(', ')}` : ''}${extractedParams.minPrice ? `\n- Preço mínimo: R$ ${extractedParams.minPrice}` : ''}${extractedParams.maxPrice ? `\n- Preço máximo: R$ ${extractedParams.maxPrice}` : ''}\n- Resumo: ${extractedParams.requirements}`
        : ''

      const productContext = productList.map(p =>
        `PRODUTO ${p.index}: "${p.name}"
Loja: ${p.store}
Preço atual: R$ ${p.price.toFixed(2)}
Preço original: R$ ${p.oldPrice.toFixed(2)}
Desconto: ${p.discountPercent}% OFF${p.freeShipping ? ' | Frete Grátis' : ''}${p.sellerName ? ` | Vendedor: ${p.sellerName}` : ''}${p.rating ? ` | Avaliação: ${p.rating}/5` : ''}${p.totalSales ? ` | Vendas: ${p.totalSales}` : ''}
Link: ${p.productUrl}`
      ).join('\n\n')

      const messages = history || []
      messages.push({
        role: 'user',
        content: `O usuário perguntou: "${message}"${requirements}

Aqui estão OS PRODUTOS REAIS encontrados nas lojas parceiras:

${productContext}

Analise CADA produto e me diga:
1. Quais produtos REALMENTE atendem os requisitos do usuário?
2. Qual o melhor custo-benefício?
3. Para cada produto aprovado, explique por que ele atende.`
      })

      const response = await callAi(messages, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde.'

      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user) {
          await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
          await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
        }
      }

      return NextResponse.json({ response, products: productList })
    }

    if (isProductRequest && scrapedProducts.length === 0) {
      const messages = history || []
      messages.push({ role: 'user', content: message })
      const response = await callAi(messages, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde.'

      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user) {
          await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
          await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
        }
      }

      return NextResponse.json({ response, products: [] })
    }

    const messages = history || []
    messages.push({ role: 'user', content: message })
    const response = await callAi(messages, SYSTEM_PROMPT) || 'Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde.'

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) {
        await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
        await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
      }
    }

    return NextResponse.json({ response, products: [] })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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
