import { chatWithJSON, MODELS } from './openhauter'
import prisma from './prisma'

const CATEGORIZE_PROMPT = `Você é um classificador de produtos. Receba o nome de um produto e retorne a categoria mais específica.

REGRAS:
- Crie categorias granulares (ex: "Intel Core i5" ao invés de só "Processador")
- Use hierarquia de 2-3 níveis: Categoria > Subcategoria > Sub-subcategoria
- Exemplos:
  "Processador Intel Core i5-13400F" → ["Eletrônicos", "Processadores", "Intel Core i5"]
  "Geladeira Consul 332L Frost Free" → ["Eletrodomésticos", "Geladeiras", "Frost Free"]
  "SSD Kingston NVMe 1TB" → ["Informática", "Armazenamento", "SSD NVMe"]
  "iPhone 15 Pro Max 256GB" → ["Celulares", "Apple iPhone", "iPhone 15 Pro Max"]
  "Notebook Dell Inspiron i5" → ["Eletrônicos", "Notebooks", "Dell Inspiron"]

Retorne apenas um array JSON: ["Categoria", "Subcategoria", "Sub-subcategoria"]
Se não couber em 3 níveis, use 2. Se for genérico demais, use 1.`

export async function autoclassifyProduct(name: string, description?: string): Promise<string[]> {
  try {
    const text = `${name}${description ? ' - ' + description : ''}`
    const result = await chatWithJSON<string[]>(MODELS.PRODUCT_SEARCH, [
      { role: 'user', content: text },
    ], CATEGORIZE_PROMPT)

    if (result && Array.isArray(result) && result.length >= 1) {
      return result
    }
  } catch (err) {
    console.error('[Categorizer] AI error:', err)
  }

  return ['Geral']
}

export async function ensureCategoryPath(path: string[]): Promise<string[]> {
  const ids: string[] = []
  let parentId: string | null = null

  for (let i = 0; i < path.length; i++) {
    const name = path[i]
    const slug = name.toLowerCase().replace(/[^a-z0-9áéíóúãõçàâêîôû]+/g, '-').replace(/^-|-$/g, '')

    const catRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM "Category" WHERE slug = $1 AND ${parentId ? '"parentId" = $2' : '"parentId" IS NULL'} LIMIT 1`,
      slug, ...(parentId ? [parentId] : [])
    )

    if (catRows.length > 0) {
      ids.push(catRows[0].id)
      parentId = catRows[0].id
    } else {
      const id = crypto.randomUUID()
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Category" (id, name, slug, "parentId", "createdAt") VALUES ($1, $2, $3, $4, NOW())`,
        id, name, slug, parentId
      )
      ids.push(id)
      parentId = id
    }
  }

  return ids
}

export async function linkProductToCategories(productId: string, categoryIds: string[]): Promise<void> {
  for (const categoryId of categoryIds) {
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId, categoryId } },
      update: {},
      create: { productId, categoryId },
    })
  }
}
