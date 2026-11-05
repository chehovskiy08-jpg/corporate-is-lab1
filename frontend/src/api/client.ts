import createClient, { type Middleware } from 'openapi-fetch'
import { tokens } from '../auth/tokens'
import type { components, paths } from './schema'

export type Category = components['schemas']['Category']
export type Product = components['schemas']['Product']
export type ProductPage = components['schemas']['PaginatedProductList']
export type Review = components['schemas']['Review']
export type Me = components['schemas']['Me']
export type Cart = components['schemas']['Cart']
export type CartItem = components['schemas']['CartItem']
export type Order = components['schemas']['Order']
export type OrderStatus = components['schemas']['OrderStatusEnum']
export type CheckoutRequest = components['schemas']['CheckoutRequest']

export class ApiError extends Error {
  status: number
  fields: Record<string, string[]>

  constructor(status: number, message: string, fields: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

// DRF отвечает на ошибки по-разному: {"detail": "..."}, {"поле": ["..."]} или ["..."]
export function toApiError(response: Response, body: unknown): ApiError {
  if (Array.isArray(body)) return new ApiError(response.status, body.join(' '))
  if (body && typeof body === 'object') {
    const { detail, ...rest } = body as Record<string, unknown>
    const fields = Object.fromEntries(
      Object.entries(rest).map(([name, value]) => [name, ([] as unknown[]).concat(value).map(String)]),
    )
    const message =
      typeof detail === 'string' ? detail : Object.values(fields).flat()[0] ?? 'Проверьте данные'
    return new ApiError(response.status, message, fields)
  }
  return new ApiError(response.status, `Сервер ответил ошибкой ${response.status}`)
}

let onSessionExpired = () => {}
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

let refreshing: Promise<boolean> | null = null

// Одно обновление на всех: несколько запросов с 401 ждут один и тот же Promise
function refreshAccessToken(): Promise<boolean> {
  refreshing ??= (async () => {
    const refresh = tokens.refresh()
    if (!refresh) return false
    const response = await fetch(new URL('/api/auth/token/refresh/', window.location.origin), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!response.ok) return false
    tokens.save(await response.json())
    return true
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

const pending = new Map<string, Request>()

const authMiddleware: Middleware = {
  onRequest({ request, id }) {
    const access = tokens.access()
    if (access) request.headers.set('Authorization', `Bearer ${access}`)
    pending.set(id, request.clone()) // тело запроса читается один раз — храним копию для повтора
    return request
  },
  async onResponse({ request, response, id }) {
    const original = pending.get(id)
    pending.delete(id)
    if (response.status !== 401 || !original || request.url.includes('/api/auth/token/')) {
      return response
    }
    if (!(await refreshAccessToken())) {
      tokens.clear()
      onSessionExpired()
      original.headers.delete('Authorization')
      return fetch(original) // открытые адреса (каталог) ответят и без токена
    }
    original.headers.set('Authorization', `Bearer ${tokens.access()}`)
    return fetch(original)
  },
}

export const api = createClient<paths>({
  baseUrl: window.location.origin,
  // fetch берём в момент запроса, а не при создании клиента: так его подменяет MSW в тестах
  fetch: (request) => fetch(request),
})
api.use(authMiddleware)
