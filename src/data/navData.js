import { navCategoriesPart1 } from './navData1'

// Only 15 categories from the original page
export const navCategories = navCategoriesPart1.map((cat, index) => ({
  ...cat,
  id: index + 1
}))
