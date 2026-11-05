import type { Product } from '../api/client'
import { useCart } from '../cart/useCart'

export default function AddToCartButton({ product }: { product: Product }) {
  const cart = useCart()
  const inCart = cart.items.find((item) => item.product_id === product.id)?.quantity ?? 0
  const available = (product.stock ?? 0) - inCart

  return (
    <button type="button" disabled={available <= 0} onClick={() => cart.add(product)}>
      {inCart > 0 ? `В корзине: ${inCart}` : 'В корзину'}
    </button>
  )
}
