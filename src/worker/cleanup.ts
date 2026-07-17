import prisma from '../lib/prisma'

export async function cleanupStaleProducts(): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const deleted = await prisma.product.deleteMany({
    where: {
      isActive: false,
      updatedAt: { lt: twentyFourHoursAgo },
    },
  })

  const deactivated = await prisma.product.updateMany({
    where: {
      isActive: true,
      updatedAt: { lt: twentyFourHoursAgo },
    },
    data: { isActive: false },
  })

  console.log(`[Cleanup] ${deactivated.count} produtos desativados (não verificados há 24h)`)
  console.log(`[Cleanup] ${deleted.count} produtos removidos (inativos há mais de 24h)`)

  return deactivated.count + deleted.count
}

export async function markCategoryProductsInactive(category: string, subcategory: string): Promise<number> {
  const result = await prisma.product.updateMany({
    where: {
      category,
      subcategory,
      isActive: true,
    },
    data: { isActive: false },
  })
  return result.count
}

export async function removeInactiveProducts(): Promise<number> {
  const result = await prisma.product.deleteMany({
    where: { isActive: false },
  })
  return result.count
}
