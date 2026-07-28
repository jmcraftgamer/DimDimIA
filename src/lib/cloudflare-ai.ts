import axios from 'axios'

const WORKER_URL = process.env.CLOUDFLARE_AI_WORKER_URL || ''

export async function chatWithCloudflare(
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<string | null> {
  if (!WORKER_URL) {
    console.error('[CloudflareAI] WORKER_URL não configurada')
    return null
  }

  console.log(`[CloudflareAI] Chamando worker: ${WORKER_URL}`)

  try {
    const { data } = await axios.post(
      WORKER_URL,
      { messages, systemPrompt },
      { timeout: 30000 }
    )
    console.log(`[CloudflareAI] Resposta recebida: ${JSON.stringify(data).slice(0, 200)}`)
    return data?.content || null
  } catch (error: any) {
    if (error?.response) {
      console.error(`[CloudflareAI] Erro HTTP ${error.response.status}:`, JSON.stringify(error.response.data))
    } else if (error?.code === 'ECONNABORTED') {
      console.error('[CloudflareAI] Timeout')
    } else {
      console.error('[CloudflareAI] Erro:', error.message)
    }
    return null
  }
}
