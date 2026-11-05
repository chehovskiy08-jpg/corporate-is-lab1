import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { orderQuery } from './api/orders'
import { categoriesQuery, productQuery, productsQuery } from './api/queries'
import { meQuery, requireManager, requireUser } from './auth/session'
import CartPage from './cart/CartPage'
import { parseCatalogParams } from './lib/catalogParams'
import { queryClient } from './queryClient'
import CatalogPage from './routes/CatalogPage'
import NotFoundPage from './routes/NotFoundPage'
import ProductPage from './routes/ProductPage'
import RootLayout from './routes/RootLayout'
import RouteError from './routes/RouteError'

// Страницы, которые нужны не каждому посетителю, загружаются
// отдельными файлами при переходе:
// формы с Zod и React Hook Form не утяжеляют каталог
const page = async (module: Promise<{ default: ComponentType }>) => ({
  Component: (await module).default,
})

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RouteError,
    HydrateFallback: () => <p className="muted">Загрузка...</p>,
    loader: async () => {
      void queryClient.prefetchQuery(categoriesQuery())
      await queryClient.ensureQueryData(meQuery())
      return null
    },
    children: [
      {
        index: true,
        Component: CatalogPage,
        loader: ({ request }) => {
          const query = parseCatalogParams(new URL(request.url).searchParams)
          void queryClient.prefetchQuery(productsQuery(query))
          return null
        },
      },
      {
        path: 'products/:slug',
        Component: ProductPage,
        ErrorBoundary: RouteError,
        loader: async ({ params }) => {
          await queryClient.ensureQueryData(productQuery(params.slug!))
          return null
        },
      },
      { path: 'cart', Component: CartPage },
      { path: 'login', lazy: () => page(import('./auth/LoginPage')) },
      { path: 'register', lazy: () => page(import('./auth/RegisterPage')) },
      {
        path: 'checkout',
        lazy: () => page(import('./orders/CheckoutPage')),
        loader: async ({ request }) => {
          await requireUser(request)
          return null
        },
      },
      {
        path: 'orders',
        lazy: () => page(import('./orders/OrdersPage')),
        loader: async ({ request }) => {
          await requireUser(request)
          return null
        },
      },
      {
        path: 'orders/:orderId',
        lazy: () => page(import('./orders/OrderPage')),
        ErrorBoundary: RouteError,
        loader: async ({ request, params }) => {
          await requireUser(request)
          await queryClient.ensureQueryData(orderQuery(Number(params.orderId)))
          return null
        },
      },
      {
        path: 'manager',
        ErrorBoundary: RouteError,
        loader: async ({ request }) => {
          await requireManager(request)
          return null
        },
        children: [
          {
            path: 'orders',
            lazy: () => page(import('./manager/ManagerOrdersPage')),
          },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
