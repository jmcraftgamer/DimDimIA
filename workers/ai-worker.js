export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Método não permitido', { status: 405 })
    }

    try {
      const { messages, systemPrompt } = await request.json()
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return Response.json({ error: 'Mensagens são obrigatórias' }, { status: 400 })
      }

      if (!env.ACCOUNT_ID || !env.API_TOKEN) {
        return Response.json({ error: 'ACCOUNT_ID e API_TOKEN não configurados' }, { status: 500 })
      }

      const fullMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: fullMessages,
            temperature: 0.3,
            max_tokens: 4000,
          }),
        }
      )

      const data = await response.json()
      return Response.json({
        content: data?.result?.response || '',
        model: 'llama-3.1-8b-instruct',
      })
    } catch (err) {
      return Response.json(
        { error: err.message || 'Erro interno' },
        { status: 500 }
      )
    }
  },
}
