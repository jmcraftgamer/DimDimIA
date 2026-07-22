import prisma from '../lib/prisma'

export async function cleanupStaleProducts(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const deleted = await prisma.product.deleteMany({
    where: {
      isActive: false,
      updatedAt: { lt: oneHourAgo },
    },
  })

  const deactivated = await prisma.product.updateMany({
    where: {
      isActive: true,
      updatedAt: { lt: oneHourAgo },
    },
    data: { isActive: false },
  })

  const withoutPromotion = await prisma.product.updateMany({
    where: {
      isActive: true,
      isPromoted: false,
    },
    data: { isActive: false },
  })

  console.log(`[Cleanup] ${deactivated.count} desativados (não verificados há 1h)`)
  console.log(`[Cleanup] ${withoutPromotion.count} desativados (sem promoção)`)
  console.log(`[Cleanup] ${deleted.count} removidos (inativos há mais de 1h)`)

  return deactivated.count + withoutPromotion.count + deleted.count
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
