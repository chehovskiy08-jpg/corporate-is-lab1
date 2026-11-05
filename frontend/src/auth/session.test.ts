import { http, HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { guestCart } from '../cart/guestCart'
import { queryClient } from '../queryClient'
import { server } from '../test/server'
import { makeProduct } from '../test/fixtures'
import { login, requireUser } from './session'

beforeEach(() => {
  localStorage.clear()
  guestCart.clear()
  queryClient.clear()
})

test('requireUser отправляет гостя на вход с адресом возврата', async () => {
  const error = await requireUser(new Request('http://localhost/checkout?step=1')).catch(
    (e) => e,
  )
  expect(error).toBeInstanceOf(Response)
  expect(error.headers.get('Location')).toBe('/login?next=%2Fcheckout%3Fstep%3D1')
})

test('при входе гостевая корзина переносится на сервер', async () => {
  let merged: unknown = null
  server.use(
    http.post('*/api/auth/token/', () => HttpResponse.json({ access: 'a', refresh: 'r' })),
    http.post('*/api/cart/merge/', async ({ request }) => {
      merged = await request.json()
      return HttpResponse.json({ items: [], count: 0, total: '0.00' })
    }),
    http.get('*/api/auth/me/', () =>
      HttpResponse.json({
        id: 1,
        username: 'buyer',
        email: '',
        first_name: '',
        last_name: '',
        is_manager: false,
      }),
    ),
  )
  guestCart.add(makeProduct({ id: 7, stock: 5 }))
  guestCart.add(makeProduct({ id: 7, stock: 5 }))

  await login('buyer', 'secret')

  expect(merged).toEqual({ items: [{ product: 7, quantity: 2 }] })
  expect(guestCart.items()).toEqual([])
})

test('неверный пароль — понятное сообщение', async () => {
  server.use(
    http.post('*/api/auth/token/', () =>
      HttpResponse.json(
        { detail: 'No active account found with the given credentials' },
        { status: 401 },
      ),
    ),
  )
  await expect(login('buyer', 'wrong')).rejects.toThrow('Неверное имя пользователя или пароль')
})
