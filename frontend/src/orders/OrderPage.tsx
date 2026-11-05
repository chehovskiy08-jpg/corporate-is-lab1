import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useLocation, useParams } from 'react-router'
import { api, toApiError } from '../api/client'
import { orderQuery } from '../api/orders'
import { formatDate, formatPrice } from '../lib/format'
import { statusLabels } from '../lib/statuses'

export default function OrderPage() {
  const id = Number(useParams().orderId)
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: order } = useSuspenseQuery(orderQuery(id))

  const cancel = useMutation({
    mutationFn: async () => {
      const { data, error, response } = await api.POST('/api/orders/{id}/cancel/', {
        params: { path: { id } },
      })
      if (error) throw toApiError(response, error)
      return data
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(orderQuery(id).queryKey, updated)
      void queryClient.invalidateQueries({ queryKey: ['orders', 'list'] })
    },
  })

  return (
    <section className="details narrow">
      {location.state?.justPlaced && <p className="success">Заказ оформлен. Спасибо!</p>}
      <h1>Заказ №{order.id}</h1>
      <p>
        {formatDate(order.created_at)} · <b>{order.status_display}</b>
      </p>
      <table className="table">
        <tbody>
          {order.items.map((item) => (
            <tr key={item.product}>
              <td>{item.product_name}</td>
              <td>{item.quantity} шт.</td>
              <td>{formatPrice(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Товары: {formatPrice(order.subtotal)}
        {Number(order.discount) > 0 && (
          <> · скидка {formatPrice(order.discount)} ({order.promo_code})</>
        )}{' '}
        · доставка {formatPrice(order.delivery_cost)}
      </p>
      <p className="price">Итого: {formatPrice(order.total)}</p>
      {order.can_cancel && (
        <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
          Отменить заказ
        </button>
      )}
      {cancel.error && <p className="error">{cancel.error.message}</p>}
      <h2>История</h2>
      <ul>
        {order.history.map((entry) => (
          <li key={entry.created_at}>
            {formatDate(entry.created_at)}: {statusLabels[entry.to_status]}, {entry.changed_by}
            {entry.comment && ` — ${entry.comment}`}
          </li>
        ))}
      </ul>
    </section>
  )
}
