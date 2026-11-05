import { Link } from 'react-router'
import { formatPrice } from '../lib/format'
import { useCart } from './useCart'

export default function CartPage() {
  const cart = useCart()

  if (cart.items.length === 0) {
    return (
      <section className="details narrow">
        <h1>Корзина</h1>
        <p className="muted">
          Корзина пуста. <Link to="/">В каталог</Link>
        </p>
      </section>
    )
  }

  return (
    <section className="details narrow">
      <h1>Корзина</h1>
      <table className="table">
        <tbody>
          {cart.items.map((item) => (
            <tr key={item.product_id}>
              <td>
                <Link to={`/products/${item.slug}`}>{item.name}</Link>
              </td>
              <td className="qty">
                <button
                  type="button"
                  aria-label={`Убрать одну штуку: ${item.name}`}
                  onClick={() => cart.setQuantity(item.product_id, item.quantity - 1)}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Добавить одну штуку: ${item.name}`}
                  disabled={item.quantity >= item.stock}
                  onClick={() => cart.setQuantity(item.product_id, item.quantity + 1)}
                >
                  +
                </button>
              </td>
              <td>{formatPrice(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {cart.error && (
        <p className="error" role="alert">
          {cart.error.message}
        </p>
      )}
      <p className="price">Итого: {formatPrice(cart.total)}</p>
      {cart.isGuest && (
        <p className="muted">
          Цены предварительные: после входа корзина перейдёт на сервер, и он пересчитает сумму.
        </p>
      )}
      <Link className="button" to="/checkout">
        Оформить заказ
      </Link>
    </section>
  )
}
