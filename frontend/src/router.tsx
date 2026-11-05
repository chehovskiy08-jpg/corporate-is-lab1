import { createBrowserRouter } from 'react-router'
import { orderQuery } from './api/orders'
import { categoriesQuery, productQuery, productsQuery } from './api/queries'
import LoginPage from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'
import { meQuery, requireManager, requireUser } from './auth/session'
import CartPage from './cart/CartPage'
import { parseCatalogParams } from './lib/catalogParams'
import CheckoutPage from './orders/CheckoutPage'
import OrderPage from './orders/OrderPage'
import OrdersPage from './orders/OrdersPage'
import { queryClient } from './queryClient'
import CatalogPage from './routes/CatalogPage'
import NotFoundPage from './routes/NotFoundPage'
import ProductPage from './routes/ProductPage'
import RootLayout from './routes/RootLayout'
import RouteError from './routes/RouteError'

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
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      {
        path: 'checkout',
        Component: CheckoutPage,
        loader: async ({ request }) => {
          await requireUser(request)
          return null
        },
      },
      {
        path: 'orders',
        Component: OrdersPage,
        loader: async ({ request }) => {
          await requireUser(request)
          return null
        },
      },
      {
        path: 'orders/:orderId',
        Component: OrderPage,
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
            lazy: async () => ({
              Component: (await import('./manager/ManagerOrdersPage')).default,
            }),
          },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
