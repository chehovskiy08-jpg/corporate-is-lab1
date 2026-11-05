import type { Category, Product, ProductPage } from '../api/client'

export const categories: Category[] = [
  { id: 1, name: 'Книги', slug: 'books', parent: null },
  { id: 2, name: 'Программирование', slug: 'programming', parent: 'books' },
  { id: 3, name: 'Электроника', slug: 'electronics', parent: null },
]

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Книга «Чистый код»',
    slug: 'bk-001',
    sku: 'BK-001',
    category: categories[1],
    description: 'Классика',
    price: '1290.00',
    old_price: null,
    discount_percent: 0,
    stock: 30,
    in_stock: true,
    image: null,
    rating: null,
    reviews_count: 0,
    ...overrides,
  }
}

export function makePage(results: Product[]): ProductPage {
  return { count: results.length, next: null, previous: null, results }
}
