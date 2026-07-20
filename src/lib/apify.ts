import prisma from './prisma'

const APIFY_BASE = 'https://api.apify.com/v2'
const WAIT_TIMEOUT = 60

function getApiKey(): string | null {
  return process.env.APIFY_API_KEY || null
}

function getMonthlyBudget(): number {
  return parseFloat(process.env.APIFY_MONTHLY_BUDGET_USD || '5')
}

async function getCurrentMonthUsage(): Promise<number> {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  try {
    const result = await prisma.apifyUsage.aggregate({
      where: { month },
      _sum: { estimatedCost: true },
    })
    return result._sum.estimatedCost || 0
  } catch {
    return 0
  }
}

async function checkBudget(estimatedCost: number): Promise<boolean> {
  const apiKey = getApiKey()
  if (!apiKey) return false

  const budget = getMonthlyBudget()
  const currentUsage = await getCurrentMonthUsage()

  return (currentUsage + estimatedCost) <= budget
}

async function logUsage(actorName: string, productsCount: number, estimatedCost: number): Promise<void> {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  try {
    await prisma.apifyUsage.create({
      data: { actorName, productsCount, estimatedCost, month },
    })
  } catch (err) {
    console.error('[Apify] Failed to log usage:', err)
  }
}

export async function runApifyActor(
  storeName: string,
  actorId: string,
  query: string,
  inputMapper: (query: string) => Record<string, any>,
  costPerProduct: number,
  maxProducts: number = 15
): Promise<any[]> {
  const apiKey = getApiKey()
  if (!apiKey) return []

  const estimatedCost = costPerProduct * maxProducts
  const withinBudget = await checkBudget(estimatedCost)

  if (!withinBudget) {
    console.warn(`[Apify] ${storeName}: Budget exceeded (limit: $${getMonthlyBudget()}/mês)`)
    return []
  }

  try {
    const input = inputMapper(query)

    const runRes = await fetch(
      `${APIFY_BASE}/acts/${actorId}/runs?token=${apiKey}&waitForFinish=${WAIT_TIMEOUT}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    )

    if (!runRes.ok) {
      const errorText = await runRes.text()
      console.error(`[Apify] ${storeName}: HTTP ${runRes.status} - ${errorText}`)
      return []
    }

    const runData = await runRes.json()
    const datasetId = runData.data?.defaultDatasetId
    if (!datasetId) {
      console.error(`[Apify] ${storeName}: No dataset ID`)
      return []
    }

    const datasetRes = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?token=${apiKey}&format=json&limit=${maxProducts}`,
    )

    if (!datasetRes.ok) return []

    const items = await datasetRes.json()
    const count = Array.isArray(items) ? items.length : 0

    const actualCost = costPerProduct * count
    await logUsage(actorId, count, actualCost)

    return Array.isArray(items) ? items : []
  } catch (err) {
    console.error(`[Apify] ${storeName}:`, err)
    return []
  }
}

export async function getApifyUsageReport() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const budget = getMonthlyBudget()
  const usage = await getCurrentMonthUsage()

  return {
    currentMonth,
    usage: Math.round(usage * 10000) / 10000,
    budget,
    remaining: Math.max(0, Math.round((budget - usage) * 10000) / 10000),
    percentageUsed: budget > 0 ? Math.round((usage / budget) * 100) : 0,
  }
}

export async function startApifyRun(actorId: string, input: Record<string, any>): Promise<{ runId: string; datasetId: string } | null> {
  try {
    const apiKey = getApiKey()
    if (!apiKey) return null
    const url = `${APIFY_BASE}/acts/${actorId}/runs?token=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    const data = await res.json()
    const fullId = data.data?.id || ''
    const runId = fullId.split('/').pop() || ''
    return { runId, datasetId: data.data?.defaultDatasetId || '' }
  } catch (err) {
    console.error('[Apify] startRun error:', err)
    return null
  }
}

export async function checkApifyRun(actorId: string, runId: string, datasetId: string): Promise<{ status: string; items?: any[] } | null> {
  try {
    const apiKey = getApiKey()
    if (!apiKey) return null
    const statusUrl = `${APIFY_BASE}/acts/${actorId}/runs/${runId}?token=${apiKey}`
    const res = await fetch(statusUrl)
    if (!res.ok) return null
    const data = await res.json()
    const status = data.data?.status

    if (status === 'SUCCEEDED' && datasetId) {
      const itemsUrl = `${APIFY_BASE}/datasets/${datasetId}/items?token=${apiKey}&format=json&limit=15`
      const dsRes = await fetch(itemsUrl)
      if (!dsRes.ok) return { status }
      const items = await dsRes.json()
      return { status, items: Array.isArray(items) ? items : [] }
    }

    return { status }
  } catch (err) {
    console.error('[Apify] checkRun error:', err)
    return null
  }
}

export const APIFY_ACTORS = {
  amazon: {
    actorId: 'viralanalyzer~amazon-brazil-intelligence',
    costPerProduct: 0.006,
    inputMapper: (q: string) => ({ searchQuery: q }),
  },
  mercadolivre: {
    actorId: 'viralanalyzer~mercadolivre-scraper',
    costPerProduct: 0.006,
    inputMapper: (q: string) => ({ searchQuery: q }),
  },
  shopee: {
    actorId: 'gio21~shopee-scraper',
    costPerProduct: 0.003,
    inputMapper: (q: string) => ({ keyword: q, limit: 15 }),
  },
  aliexpress: {
    actorId: 'viralanalyzer~aliexpress-affiliate-products',
    costPerProduct: 0.0009,
    inputMapper: (q: string) => ({ keyword: q, maxResults: 15 }),
  },
  pichau: {
    actorId: 'karamelo~pichau-scraper',
    costPerProduct: 0.005,
    inputMapper: (q: string) => ({ searchQuery: q }),
  },
  terabyteshop: {
    actorId: 'apify~web-scraper',
    costPerProduct: 0.005,
    inputMapper: (q: string) => ({
      startUrls: [{ url: `https://www.terabyteshop.com.br/busca?q=${encodeURIComponent(q)}` }],
      pageFunction: `const products = []; document.querySelectorAll('[class*="product"], .product-box').forEach(el => { const name = el.querySelector('[class*="title"], h2')?.textContent?.trim(); const price = el.querySelector('[class*="price"], [class*="preco"]')?.textContent?.match(/[\\d.,]+/)?.[0]; if (name && price) products.push({ name, price: parseFloat(price.replace(/\\./g,'').replace(',','.')), image: el.querySelector('img')?.src, url: el.querySelector('a')?.href }); }); return products;`,
    }),
  },
} as const
