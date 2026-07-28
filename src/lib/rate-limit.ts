import prisma from './prisma'

const MAX_AI_REQUESTS_PER_DAY = 30

export async function checkAiRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const count = await prisma.chatMessage.count({
    where: {
      userId,
      role: 'assistant',
      createdAt: { gte: today },
    },
  })

  return {
    allowed: count < MAX_AI_REQUESTS_PER_DAY,
    remaining: Math.max(0, MAX_AI_REQUESTS_PER_DAY - count),
  }
}

export const AI_LIMIT_MESSAGE = `Você atingiu o limite de ${MAX_AI_REQUESTS_PER_DAY} conversas com IA por dia. Mas ainda posso pesquisar produtos para você! Me diga o que procura.`
