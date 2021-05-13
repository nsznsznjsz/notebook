import { isPost, normalizeString } from "./utils"
import type { App, Page } from "@vuepress/core"
import type {
  Categories,
  Category,
  PageToCategoriesMap,
  PageToRawCategoryNameMap,
  ThemeFrontmatter,
} from "../types"

let resolved = false
const rootCategories: Categories = []
const pageToCategoriesMap: PageToCategoriesMap = {}
const pageToRawCategoryNameMap: PageToRawCategoryNameMap = {}

const createNewCategory = (slug: string): Category => ({
  slug,
  name: "",
  pages: [],
  parent: null, // filled in client side
  ancestors: [], // filled in client side
  children: [],
})

const resovePageCategories = (
  page: Page & { frontmatter: ThemeFrontmatter }
) => {
  const raw = page.frontmatter.categories || "Default"
  const categoriesRoutes = Array.isArray(raw)
    ? raw.some(Array.isArray)
      ? raw.map((a) => (Array.isArray(a) ? a : [a]))
      : ([raw] as string[][])
    : [[raw]]

  const rawNameMap: Record<string, string> = {}
  const currentCategories = categoriesRoutes.map((routes) =>
    routes.reduce((parent: Category | null, route: string) => {
      const path = normalizeString(route)
      const slug = parent ? `${parent.slug}/${path}` : path
      const children = parent?.children ?? rootCategories
      const next = children.find((a) => a.slug === slug)

      rawNameMap[slug] = route

      if (next) return next
      const newCategory = createNewCategory(slug)
      const arr = parent?.children ?? rootCategories
      arr.push(newCategory)
      return newCategory
    }, null)
  ) as Categories

  currentCategories.forEach((category) => category.pages.push(page.path))
  pageToCategoriesMap[page.path] = currentCategories.map((a) => a.slug)
  pageToRawCategoryNameMap[page.path] = rawNameMap

  return currentCategories
}

const _resolveCategories = (app: App) =>
  app.pages.filter(isPost).forEach(resovePageCategories)

export const resolveCategories = (app: App) => {
  if (!resolved) _resolveCategories(app)
  resolved = true
  return {
    rootCategories,
    pageToCategoriesMap,
    pageToRawCategoryNameMap,
  }
}