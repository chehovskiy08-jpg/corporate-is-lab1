import { queryOptions } from '@tanstack/react-query'
import { data, redirect } from 'react-router'
import { api, setSessionExpiredHandler, toApiError, type Me } from '../api/client'
import { guestCart } from '../cart/guestCart'
import { queryClient } from '../queryClient'
import { tokens } from './tokens'

export const meQuery = () =>
  queryOptions({
    queryKey: ['me'],
    queryFn: async (): Promise<Me | null> => {
      if (!tokens.access() && !tokens.refresh()) return null
      const { data, error, response } = await api.GET('/api/auth/me/')
      if (response.status === 401) return null
      if (error) throw toApiError(response, error)
      return data
    },
    staleTime: Infinity,
  })

function resetUserData() {
  queryClient.setQueryData(meQuery().queryKey, null)
  queryClient.removeQueries({ queryKey: ['cart'] })
  queryClient.removeQueries({ queryKey: ['orders'] })
}

setSessionExpiredHandler(resetUserData)

export async function login(username: string, password: string) {
  const { data, error, response } = await api.POST('/api/auth/token/', {
    body: { username, password },
  })
  if (!data) {
    throw response.status === 401
      ? toApiError(response, { detail: 'Неверное имя пользователя или пароль' })
      : toApiError(response, error)
  }
  tokens.save(data)
  const items = guestCart.items()
  if (items.length > 0) {
    await api.POST('/api/cart/merge/', {
      body: { items: items.map((item) => ({ product: item.product_id, quantity: item.quantity })) },
    })
    guestCart.clear()
  }
  queryClient.removeQueries({ queryKey: ['cart'] })
  await queryClient.invalidateQueries({ queryKey: meQuery().queryKey })
}

export async function register(body: { username: string; email: string; password: string }) {
  const { error, response } = await api.POST('/api/auth/register/', { body })
  if (error) throw toApiError(response, error)
  await login(body.username, body.password)
}

export function logout() {
  tokens.clear()
  resetUserData()
}

export async function requireUser(request: Request): Promise<Me> {
  const me = await queryClient.ensureQueryData(meQuery())
  if (!me) {
    const url = new URL(request.url)
    throw redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`)
  }
  return me
}

export async function requireManager(request: Request): Promise<Me> {
  const me = await requireUser(request)
  if (!me.is_manager) throw data('Раздел только для менеджеров магазина', { status: 403 })
  return me
}
