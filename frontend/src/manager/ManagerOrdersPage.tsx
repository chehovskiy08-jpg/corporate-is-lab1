import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { api, toApiError, type Order, type OrderStatus } from '../api/client'
import { ordersQuery } from '../api/orders'
import { formatDate, formatPrice } from '../lib/format'
import { statusLabels, transitionLabels } from '../lib/statuses'

const statuses = Object.keys(statusLabels) as OrderStatus[]

function isStatus(value: string | null): value is OrderStatus {
  return value !== null && (statuses as string[]).includes(value)
}

function OrderRow({ order }: { order: Order }) {
  const queryClient = useQueryClient()
  const change = useMutation({
    mutationFn: async (status: OrderStatus) => {
      const comment = status === 'cancelled' ? (window.prompt('Причина отмены') ?? '') : ''
      const { data, error, response } = await api.POST('/api/orders/{id}/status/', {
        params: { path: { id: order.id } },
        body: { status, comment },
      })
      if (error) throw toApiError(response, error)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  return (
    <tr>
      <td>
        <Link to={`/orders/${order.id}`}>№{order.id}</Link>
      </td>
      <td>{formatDate(order.created_at)}</td>
      <td>{order.full_name}</td>
      <td>{formatPrice(order.total)}</td>
      <td>{order.status_display}</td>
      <td className="actions">
        {order.allowed_transitions.map((status) => (
          <button
            key={status}
            type="button"
            className={status === 'cancelled' ? 'secondary' : undefined}
            disabled={change.isPending}
            onClick={() => change.mutate(status)}
          >
            {transitionLabels[status]}
          </button>
        ))}
        {change.error && <span className="error">{change.error.message}</span>}
      </td>
    </tr>
  )
}

export default function ManagerOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const status = isStatus(statusParam) ? statusParam : undefined
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const { data, isPending, isError, error, isPlaceholderData } = useQuery(
    ordersQuery({ status, page }),
  )

  return (
    <section className="details">
      <h1>Заказы магазина</h1>
      <label>
        Статус{' '}
        <select
          value={status ?? ''}
          onChange={(e) => setSearchParams(e.target.value ? { status: e.target.value } : {})}
        >
          <option value="">Все</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {statusLabels[value]}
            </option>
          ))}
        </select>
      </label>
      {isPending ? (
        <p className="muted">Загрузка...</p>
      ) : isError ? (
        <p className="error">{error.message}</p>
      ) : data.results.length === 0 ? (
        <p className="muted">Заказов нет.</p>
      ) : (
        <table className={isPlaceholderData ? 'table stale' : 'table'}>
          <tbody>
            {data.results.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
