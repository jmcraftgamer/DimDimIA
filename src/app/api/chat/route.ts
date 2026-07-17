import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { chatWithModel, MODELS, SYSTEM_PROMPTS } from '../../../lib/openhauter'
import { searchProducts } from '../../../lib/scrapers'
import prisma from '../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    const messages = history || []
    messages.push({ role: 'user', content: message })

    const lowercaseMsg = message.toLowerCase()
    const isProductSearch = [
      'quero', 'busque', 'encontre', 'procure', 'pesquise',
      'preço', 'promoção', 'barato', 'melhor', 'comprar',
      'quanto custa', 'qual o preço',
    ].some((kw) => lowercaseMsg.includes(kw))

    if (isProductSearch) {
      const scrapedProducts = await searchProducts(message)
      const productInfo = scrapedProducts.slice(0, 5).map((p, i) =>
        `${i + 1}. **${p.name}** - R$ ${p.price.toFixed(2)}${p.oldPrice ? ` (de R$ ${p.oldPrice.toFixed(2)})` : ''} - ${p.store}${p.freeShipping ? ' - Frete Grátis' : ''}${p.coupon ? ` - Cupom: ${p.coupon}` : ''}\n[Ver produto](${p.productUrl})`
      ).join('\n\n')

      const aiResponse = await chatWithModel(
        MODELS.CHAT_ASSISTANT,
        [{ role: 'user', content: `O usuário perguntou: "${message}". Aqui estão os resultados da pesquisa:\n\n${productInfo}\n\nAnalise e sugira os melhores produtos.` }],
        SYSTEM_PROMPTS.CHAT_ASSISTANT
      )

      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user) {
          await prisma.chatMessage.create({
            data: { content: message, role: 'user', userId: user.id },
          })
          await prisma.chatMessage.create({
            data: { content: aiResponse, role: 'assistant', userId: user.id },
          })
        }
      }

      return NextResponse.json({
        response: aiResponse,
        products: scrapedProducts.slice(0, 5),
      })
    }

    const response = await chatWithModel(MODELS.CHAT_ASSISTANT, messages, SYSTEM_PROMPTS.CHAT_ASSISTANT)

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) {
        await prisma.chatMessage.create({
          data: { content: message, role: 'user', userId: user.id },
        })
        await prisma.chatMessage.create({
          data: { content: response, role: 'assistant', userId: user.id },
        })
      }
    }

    return NextResponse.json({ response, products: [] })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
