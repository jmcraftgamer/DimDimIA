import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { chatWithModel, MODELS } from '../../../lib/openhauter'
import { searchProducts } from '../../../lib/scrapers'
import prisma from '../../../lib/prisma'

const SYSTEM_PROMPT = `Você é a DimDimIA, uma assistente ESPECIALIZADA em encontrar as MELHORES promoções e descontos em lojas brasileiras.

SUAS CAPACIDADES:
- Você tem acesso a dados REAIS de produtos de várias lojas (Mercado Livre, Amazon, Kabum, AliExpress, Shopee, Pichau, Terabyte)
- Você recebe resultados de busca REAIS sempre que o usuário pede produtos
- Você ANALISA e COMPARA os resultados para recomendar o melhor custo-benefício

QUANDO RECEBER RESULTADOS DE PRODUTOS:
1. Analise CADA produto individualmente
2. Destaque o desconto real: "de R$ X por R$ Y (Z% OFF)"
3. Mencione frete grátis, cupons e avaliações quando disponíveis
4. Compare produtos similares entre lojas diferentes
5. Recomende o MELHOR custo-benefício explicando o porquê
6. Seja detalhista e útil — o usuário quer ECONOMIZAR dinheiro

FORMATO DE RESPOSTA COM PRODUTOS:
- Use uma estrutura clara: lista numerada ou tópicos
- Para cada produto relevante, inclua: nome, preço COM desconto, % OFF, loja
- SEMPRE mencione o valor do desconto (ex: "de R$ 199 por R$ 129 — 35% OFF")
- Destaque ofertas especiais (frete grátis, cupom, etc.)
- Ao final, dê sua recomendação pessoal

REGRAS:
- Responda SEMPRE em português brasileiro
- Seja natural e conversacional, mas INFORMATIVA
- NUNCA finja resultados — use apenas os dados reais que recebeu
- Se não encontrar produtos relevantes, avise honestamente
- Se o usuário pedir algo que não seja produto, converse normalmente`

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

    if (isProductRequest) {
      console.log(`[Chat] Buscando produtos para: "${message}"`)
      const rawProducts = await searchProducts(message)
      const scrapedProducts = rawProducts.slice(0, 10)

      if (scrapedProducts.length === 0) {
        const messages = history || []
        messages.push({ role: 'user', content: message })
        const response = await chatWithModel(MODELS.CHAT_ASSISTANT, messages, SYSTEM_PROMPT)

        if (session?.user?.email) {
          const user = await prisma.user.findUnique({ where: { email: session.user.email } })
          if (user) {
            await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
            await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
          }
        }

        return NextResponse.json({ response, products: [] })
      }

      const productList = scrapedProducts.map((p, i) => {
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
        content: `O usuário perguntou: "${message}"

Aqui estão os produtos REAIS encontrados nas lojas parceiras:

${productContext}

Com base nesses dados REAIS, analise e responda ao usuário. Destaque os melhores descontos, compare entre lojas, e dê sua recomendação.`
      })

      const response = await chatWithModel('google/gemini-2.0-flash-001', messages, SYSTEM_PROMPT)

      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user) {
          await prisma.chatMessage.create({ data: { content: message, role: 'user', userId: user.id } })
          await prisma.chatMessage.create({ data: { content: response, role: 'assistant', userId: user.id } })
        }
      }

      return NextResponse.json({ response, products: productList })
    }

    const messages = history || []
    messages.push({ role: 'user', content: message })
    const response = await chatWithModel('google/gemini-2.0-flash-001', messages, SYSTEM_PROMPT)

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
