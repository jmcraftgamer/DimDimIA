import { searchProducts } from '../lib/scrapers'
import prisma from '../lib/prisma'
import { getNextScheduleItem, getProgress } from './scheduler'
import { rankProducts } from './ai-ranker'
import { cleanupStaleProducts, markCategoryProductsInactive } from './cleanup'
import { ScrapedProduct } from '../types'

const CYCLE_INTERVAL_MS = 5 * 60 * 1000
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000
let lastCleanup = 0
let cycleCount = 0

async function processOneSubcategory(): Promise<void> {
  const item = getNextScheduleItem()
  if (!item) {
    console.log('[Worker] Nenhum item na fila, reiniciando...')
    return
  }

  const { category, subcategory } = item
  const startTime = Date.now()
  console.log(`\n[Worker] [${getProgress()}] ${category.name} > ${subcategory.name}`)
  console.log(`[Worker] Queries: ${subcategory.queries.join(', ')}`)

  let allProducts: ScrapedProduct[] = []
  let errors = 0

  for (const query of subcategory.queries) {
    try {
      const results = await searchProducts(query)
      const filtered = results.filter((p: ScrapedProduct) => {
        const name = p.name.toLowerCase()
        return query
          .toLowerCase()
          .split(' ')
          .some((kw) => kw.length > 2 && name.includes(kw))
      })
      allProducts.push(...filtered)
      console.log(`[Worker]   "${query}": ${filtered.length} produtos`)
    } catch (err) {
      errors++
      console.error(`[Worker]   Erro na query "${query}":`, err)
    }
  }

  const uniqueProducts = removeDuplicates(allProducts)
  console.log(`[Worker] Total único: ${uniqueProducts.length} produtos`)

  if (uniqueProducts.length === 0) {
    console.log(`[Worker] Nenhum produto encontrado para ${category.name} > ${subcategory.name}`)
    await logWorkerResult(category.slug, subcategory.name, 'no_products', 0, 0, startTime)
    return
  }

  console.log(`[Worker] Enviando ${uniqueProducts.length} produtos para IA ranquear...`)
  const { top5, raw } = await rankProducts(uniqueProducts, category.name, subcategory.name)
  console.log(`[Worker] IA ranqueou ${top5.length} produtos`)

  await markCategoryProductsInactive(category.slug, subcategory.name)

  let saved = 0
  for (let i = 0; i < top5.length; i++) {
    const p = top5[i]
    try {
      const id = `${p.store}-${category.slug}-${subcategory.name}-${p.name.substring(0, 40)}`

      const existing = await prisma.product.findUnique({ where: { id } })

      if (existing) {
        await prisma.product.update({
          where: { id },
          data: {
            name: p.name,
            description: p.description || existing.description,
            price: p.price,
            oldPrice: p.oldPrice ?? existing.oldPrice,
            coupon: p.coupon ?? existing.coupon,
            couponCode: p.couponCode ?? existing.couponCode,
            rating: p.rating ?? existing.rating,
            totalSales: p.totalSales ?? existing.totalSales,
            freeShipping: p.freeShipping ?? existing.freeShipping,
            tax: p.tax ?? existing.tax,
            score: p.score,
            reason: p.reason || existing.reason,
            position: i + 1,
            isActive: true,
            lastVerified: new Date(),
          },
        })
      } else {
        await prisma.product.create({
          data: {
            id,
            name: p.name,
            description: p.description,
            price: p.price,
            oldPrice: p.oldPrice ?? null,
            coupon: p.coupon ?? null,
            couponCode: p.couponCode ?? null,
            category: category.slug,
            subcategory: subcategory.name,
            store: p.store,
            imageUrl: p.imageUrl,
            productUrl: p.productUrl,
            rating: p.rating ?? null,
            totalSales: p.totalSales ?? null,
            freeShipping: p.freeShipping ?? null,
            tax: p.tax ?? null,
            score: p.score,
            reason: p.reason || null,
            position: i + 1,
            isActive: true,
            lastVerified: new Date(),
          },
        })
      }
      saved++
    } catch (err) {
      console.error(`[Worker] Erro ao salvar produto "${p.name}":`, err)
    }
  }

  const duration = Date.now() - startTime
  console.log(`[Worker] ✓ ${saved}/${top5.length} produtos salvos em ${duration}ms`)

  await logWorkerResult(category.slug, subcategory.name, 'success', uniqueProducts.length, saved, startTime)
}

function removeDuplicates(products: ScrapedProduct[]): ScrapedProduct[] {
  const seen = new Set<string>()
  return products.filter((p) => {
    const key = `${p.name.substring(0, 60)}-${p.store}-${p.price}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function logWorkerResult(
  category: string,
  subcategory: string,
  status: string,
  found: number,
  saved: number,
  startTime: number
): Promise<void> {
  const duration = Date.now() - startTime
  try {
    await prisma.workerLog.create({
      data: {
        category,
        subcategory,
        status,
        productsFound: found,
        productsSaved: saved,
        duration,
        message: `${status === 'success' ? 'OK' : 'Sem produtos'} | ${found} encontrados, ${saved} salvos`,
      },
    })
  } catch (err) {
    // ignore log errors
  }
}

async function runCleanup(): Promise<void> {
  console.log('[Worker] Rodando limpeza de produtos...')
  try {
    await cleanupStaleProducts()
  } catch (err) {
    console.error('[Worker] Erro na limpeza:', err)
  }
}

async function main(): Promise<void> {
  console.log('══════════════════════════════════════════════')
  console.log('  DimDimIA Worker - 24/7')
  console.log('  Buscando as melhores promoções 24 horas por dia')
  console.log(`  Ciclo a cada ${CYCLE_INTERVAL_MS / 1000}s`)
  console.log('══════════════════════════════════════════════')
  console.log('')

  try {
    await prisma.$connect()
    console.log('[Worker] Banco de dados conectado')
  } catch (err) {
    console.error('[Worker] Erro ao conectar no banco:', err)
    process.exit(1)
  }

  while (true) {
    try {
      cycleCount++
      console.log(`\n━━━ Ciclo #${cycleCount} ━━━`)
      await processOneSubcategory()

      const now = Date.now()
      if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
        await runCleanup()
        lastCleanup = now
      }

      console.log(`[Worker] Aguardando ${CYCLE_INTERVAL_MS / 1000}s até o próximo ciclo...`)
      await sleep(CYCLE_INTERVAL_MS)
    } catch (err) {
      console.error('[Worker] Erro no ciclo:', err)
      console.log(`[Worker] Aguardando ${CYCLE_INTERVAL_MS / 1000}s e tentando novamente...`)
      await sleep(CYCLE_INTERVAL_MS)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main()
