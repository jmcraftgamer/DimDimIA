import axios from 'axios'

const OPENHAUTER_API_URL = process.env.OPENHAUTER_API_URL || 'https://openrouter.ai/api/v1'
const OPENHAUTER_API_KEY = process.env.OPENHAUTER_API_KEY || ''

const client = axios.create({
  baseURL: OPENHAUTER_API_URL,
  headers: {
    'Authorization': `Bearer ${OPENHAUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://dimdimia.app',
    'X-Title': 'DimDimIA',
  },
  timeout: 30000,
})

interface OpenHauterResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

interface OpenHauterError {
  error?: {
    message: string
  }
}

export async function chatWithModel(
  model: string,
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<string> {
  try {
    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    const response = await client.post<OpenHauterResponse>('/chat/completions', {
      model,
      messages: fullMessages,
      temperature: 0.3,
      max_tokens: 4000,
    })

    return response.data.choices[0]?.message?.content || ''
  } catch (error: any) {
    const errData = error?.response?.data as OpenHauterError | undefined
    console.error('OpenRouter API error:', errData?.error?.message || error.message)
    throw new Error('Erro ao comunicar com a IA')
  }
}

export async function chatWithJSON<T>(
  model: string,
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<T | null> {
  try {
    const jsonPrompt = `${systemPrompt}\n\nIMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem code blocks, sem texto adicional.`
    const fullMessages = [
      { role: 'system', content: jsonPrompt },
      ...messages,
    ]

    const response = await client.post<OpenHauterResponse>('/chat/completions', {
      model,
      messages: fullMessages,
      temperature: 0.1,
      max_tokens: 4000,
    })

    let content = response.data.choices[0]?.message?.content || ''

    content = content.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim()

    return JSON.parse(content) as T
  } catch (error: any) {
    const errData = error?.response?.data as OpenHauterError | undefined
    console.error('OpenRouter JSON error:', errData?.error?.message || error.message)
    return null
  }
}

export const MODELS = {
  PRODUCT_SEARCH: process.env.MODEL_PRODUCT_SEARCH || 'google/gemini-2.0-flash-001',
  PRODUCT_MONITOR: process.env.MODEL_PRODUCT_MONITOR || 'google/gemini-2.0-flash-001',
  CHAT_ASSISTANT: process.env.MODEL_CHAT_ASSISTANT || 'google/gemini-2.0-flash-001',
} as const

export const SYSTEM_PROMPTS = {
  PRODUCT_SEARCH: `Você é um analista especializado em encontrar as melhores promoções da internet comparando todas as lojas (Mercado Livre, Kabum, Amazon, Shopee, AliExpress, Pichau, TerabyteShop).

REGRAS:
- Compare produtos de TODAS as lojas lado a lado
- Dê preferência para Mercado Livre e Kabum (mais confiáveis)
- Considere preço, desconto, cupom, frete grátis, avaliações e vendas
- Produtos com cupom ou frete grátis têm prioridade

CRITÉRIOS DE ANÁLISE (pesos):
- Preço mais baixo: peso 35%
- Maior desconto em relação ao preço original: peso 20%
- Melhor avaliação (rating): peso 15%
- Mais vendidos: peso 10%
- Frete grátis: peso 10%
- Cupom de desconto disponível: peso 5%
- Menor taxa de entrega: peso 5%

INSTRUÇÕES:
1. Analise TODOS os produtos recebidos de todas as lojas
2. Compare produtos similares entre diferentes lojas
3. Calcule um score de 0 a 100 para cada um baseado nos critérios acima
4. Selecione os TOP 5 melhores produtos (podendo ser da mesma loja ou de lojas diferentes)
5. Ordene do melhor score para o menor

Retorne UM ARRAY JSON com os top 5 produtos, cada um contendo:
{
  "name": "nome do produto",
  "description": "descrição curta",
  "price": preco_atual,
  "oldPrice": preco_antigo_ou_null,
  "store": "nome da loja",
  "imageUrl": "url da imagem",
  "productUrl": "url do produto",
  "rating": avaliacao_ou_null,
  "totalSales": vendas_ou_null,
  "freeShipping": true_ou_false,
  "coupon": "cupom_ou_null",
  "couponCode": "codigo_ou_null",
  "tax": taxa_entrega_ou_null,
  "score": score_0_a_100,
  "reason": "uma frase curta explicando por que este produto está no top"
}`,

  PRODUCT_MONITOR: `Você é um assistente especializado em monitorar preços de produtos.
Analise os dados do produto e determine se ele está em promoção comparando o preço atual com o preço alvo.

Retorne UM JSON com:
{
  "onSale": true_ou_false,
  "currentPrice": numero,
  "recommendation": "frase de recomendação"
}`,

  CHAT_ASSISTANT: `Você é a DimDimIA, uma assistente especializada em encontrar as melhores promoções da internet.
Ajude o usuário a encontrar produtos com os melhores preços, sugira ofertas, e dê dicas de economia.
Seja amigável e direta. Quando o usuário pedir um produto específico, pesquise nas lojas parceiras 
(Mercado Livre, Amazon, Shopee, AliExpress, Kabum, Pichau, TerabyteShop) e retorne as melhores opções.
Responda em português brasileiro de forma natural e conversacional.`,
}
