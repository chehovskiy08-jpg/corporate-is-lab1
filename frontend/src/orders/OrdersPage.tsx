import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ordersQuery } from '../api/orders'
import { formatDate } from '../lib/format'
import { formatPrice } from '../lib/format'

export default function OrdersPage() {
  const { data, isPending, isError, error } = useQuery(ordersQuery({}))

  if (isPending) return <p className="muted">Загрузка...</p>
  if (isError) return <p className="error">Не удалось загрузить заказы: {error.message}</p>

  return (
    <section className="details">
      <h1>Мои заказы</h1>
      {data.results.length === 0 ? (
        <p className="muted">
          Заказов пока нет. <Link to="/">В каталог</Link>
        </p>
      ) : (
        <table className="table">
          <tbody>
            {data.results.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link to={`/orders/${order.id}`}>Заказ №{order.id}</Link>
                </td>
                <td>{formatDate(order.created_at)}</td>
                <td>{order.status_display}</td>
                <td>{formatPrice(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
