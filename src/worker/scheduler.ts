import { ALL_CATEGORIES, CategoryGroup, SubCategory } from './categories'

export interface ScheduleItem {
  category: CategoryGroup
  subcategory: SubCategory
}

let currentCategoryIndex = 0
let currentSubcategoryIndex = 0

export function getNextScheduleItem(): ScheduleItem | null {
  const totalCategories = ALL_CATEGORIES.length

  for (let c = 0; c < totalCategories; c++) {
    const catIdx = (currentCategoryIndex + c) % totalCategories
    const category = ALL_CATEGORIES[catIdx]

    if (currentCategoryIndex !== catIdx) {
      currentSubcategoryIndex = 0
    }

    const subcategories = category.subcategories
    for (let s = 0; s < subcategories.length; s++) {
      const subIdx = (currentSubcategoryIndex + s) % subcategories.length
      const subcategory = subcategories[subIdx]

      currentCategoryIndex = catIdx
      currentSubcategoryIndex = (subIdx + 1) % subcategories.length

      return { category, subcategory }
    }
  }

  return null
}

export function resetScheduler(): void {
  currentCategoryIndex = 0
  currentSubcategoryIndex = 0
}

export function getTotalItems(): number {
  return ALL_CATEGORIES.reduce((acc, cat) => acc + cat.subcategories.length, 0)
}

export function getProgress(): string {
  const total = getTotalItems()
  let processed = 0
  for (let i = 0; i < currentCategoryIndex; i++) {
    processed += ALL_CATEGORIES[i].subcategories.length
  }
  processed += currentSubcategoryIndex
  return `${processed}/${total}`
}
