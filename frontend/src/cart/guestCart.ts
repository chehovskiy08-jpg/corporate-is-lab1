import { useSyncExternalStore } from 'react'
import type { CartItem, Product } from '../api/client'

// Корзина гостя живёт в localStorage. Цены здесь — снимок на момент добавления:
// после входа корзина переносится на сервер (POST /api/cart/merge/), и считает уже он
const KEY = 'shop-guest-cart'
const listeners = new Set<() => void>()
let cache: CartItem[] | null = null

function read(): CartItem[] {
  if (cache === null) {
    try {
      cache = JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartItem[]
    } catch {
      cache = []
    }
  }
  return cache
}

function write(items: CartItem[]) {
  cache = items
  localStorage.setItem(KEY, JSON.stringify(items))
  listeners.forEach((listener) => listener())
}

function withTotal(item: Omit<CartItem, 'total'>): CartItem {
  return { ...item, total: (Number(item.price) * item.quantity).toFixed(2) }
}

export const guestCart = {
  items: read,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  add(product: Product, quantity = 1) {
    const items = read()
    const current = items.find((item) => item.product_id === product.id)?.quantity ?? 0
    const next = Math.min(current + quantity, product.stock ?? 0)
    const rest = items.filter((item) => item.product_id !== product.id)
    write([
      ...rest,
      withTotal({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.image ?? null,
        stock: product.stock ?? 0,
        price: product.price,
        quantity: next,
      }),
    ])
  },
  setQuantity(productId: number, quantity: number) {
    write(
      read()
        .map((item) =>
          item.product_id === productId
            ? withTotal({ ...item, quantity: Math.min(quantity, item.stock) })
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  },
  clear() {
    write([])
  },
}

export function useGuestCart(): CartItem[] {
  return useSyncExternalStore(guestCart.subscribe, guestCart.items)
}
