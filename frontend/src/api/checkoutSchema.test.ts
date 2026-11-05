import { http, HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { tokens } from '../auth/tokens'
import { server } from '../test/server'
import { api, toApiError } from './client'

beforeEach(() => localStorage.clear())

test('toApiError раскладывает ошибки DRF по полям', () => {
  const response = new Response(null, { status: 400 })
  const error = toApiError(response, { phone: ['Неверный номер'], detail: undefined })
  expect(error.fields).toEqual({ phone: ['Неверный номер'] })
  expect(error.message).toBe('Неверный номер')
  expect(toApiError(response, ['Вы уже оставили отзыв']).message).toBe('Вы уже оставили отзыв')
})

test('два запроса с просроченным токеном вызывают одно обновление', async () => {
  tokens.save({ access: 'old', refresh: 'refresh-token' })
  let refreshCalls = 0
  server.use(
    http.post('*/api/auth/token/refresh/', () => {
      refreshCalls += 1
      return HttpResponse.json({ access: 'new' })
    }),
    http.get('*/api/auth/me/', ({ request }) =>
      request.headers.get('Authorization') === 'Bearer new'
        ? HttpResponse.json({
            id: 1,
            username: 'buyer',
            email: '',
            first_name: '',
            last_name: '',
            is_manager: false,
          })
        : HttpResponse.json({ detail: 'Token is invalid' }, { status: 401 }),
    ),
  )

  const [first, second] = await Promise.all([api.GET('/api/auth/me/'), api.GET('/api/auth/me/')])

  expect(first.data?.username).toBe('buyer')
  expect(second.data?.username).toBe('buyer')
  expect(refreshCalls).toBe(1)
  expect(tokens.access()).toBe('new')
})
