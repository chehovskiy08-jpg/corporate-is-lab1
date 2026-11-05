import type { paths } from '../api/schema'

export type ProductQuery = NonNullable<
  paths['/api/catalog/products/']['get']['parameters']['query']
>

export type Ordering = NonNullable<ProductQuery['ordering']>[number]

export const orderingOptions: { value: Ordering | ''; label: string }[] = [
  { value: '', label: 'Сначала новые' },
  { value: 'price', label: 'Сначала дешёвые' },
  { value: '-price', label: 'Сначала дорогие' },
  { value: '-rating', label: 'По рейтингу' },
  { value: 'name', label: 'По названию' },
]

const orderingValues = new Set<string>(orderingOptions.map((option) => option.value))

export function parseCatalogParams(searchParams: URLSearchParams): ProductQuery {
  const query: ProductQuery = {}
  const q = searchParams.get('q')
  if (q) query.q = q
  const category = searchParams.get('category')
  if (category) query.category = category
  const priceMin = Number(searchParams.get('price_min'))
  if (priceMin > 0) query.price_min = priceMin
  const priceMax = Number(searchParams.get('price_max'))
  if (priceMax > 0) query.price_max = priceMax
  if (searchParams.get('in_stock') === 'true') query.in_stock = true
  if (searchParams.get('on_sale') === 'true') query.on_sale = true
  const ordering = searchParams.get('ordering')
  if (ordering && orderingValues.has(ordering)) query.ordering = [ordering as Ordering]
  const page = Number(searchParams.get('page'))
  if (Number.isInteger(page) && page > 1) query.page = page
  return query
}
