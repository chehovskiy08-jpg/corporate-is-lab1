import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { server } from '../test/server'
import { renderRoute } from '../test/render'
import CatalogPage from './CatalogPage'

test('показывает товары и их количество', async () => {
  renderRoute(<CatalogPage />)
  expect(await screen.findByText('Книга «Канбан»')).toBeInTheDocument()
  expect(screen.getByText('Найдено: 2')).toBeInTheDocument()
  expect(screen.getByText('1 290 ₽')).toBeInTheDocument()
})

test('передаёт фильтры из адреса в запрос к API', async () => {
  let requested = ''
  server.use(
    http.get('*/api/catalog/products/', ({ request }) => {
      requested = new URL(request.url).search
      return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
    }),
  )
  renderRoute(<CatalogPage />, '/?category=books&ordering=-price&in_stock=true')
  expect(await screen.findByText(/Ничего не найдено/)).toBeInTheDocument()
  expect(new URLSearchParams(requested).get('category')).toBe('books')
  expect(new URLSearchParams(requested).get('ordering')).toBe('-price')
})

test('сортировка меняет адрес и сбрасывает страницу', async () => {
  renderRoute(<CatalogPage />, '/?page=2')
  await screen.findByText('Книга «Канбан»')
  await userEvent.selectOptions(screen.getByLabelText('Сортировка'), '-price')
  expect(screen.getByTestId('location')).toHaveTextContent('/?ordering=-price')
})

test('при ошибке сервера показывает сообщение и кнопку повтора', async () => {
  server.use(
    http.get('*/api/catalog/products/', () =>
      HttpResponse.json({ detail: 'Сервис недоступен' }, { status: 503 }),
    ),
  )
  renderRoute(<CatalogPage />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Сервис недоступен')
  expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
})
