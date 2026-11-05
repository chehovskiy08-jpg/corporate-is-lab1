import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api, toApiError, type OrderStatus } from './client'

export const ordersQuery = (params: { page?: number; status?: OrderStatus }) =>
  queryOptions({
    queryKey: ['orders', 'list', params],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/orders/', {
        params: { query: params },
      })
      if (error) throw toApiError(response, error)
      return data
    },
    placeholderData: keepPreviousData,
  })

export const orderQuery = (id: number) =>
  queryOptions({
    queryKey: ['orders', 'detail', id],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/orders/{id}/', {
        params: { path: { id } },
      })
      if (error) throw toApiError(response, error)
      return data
    },
  })
