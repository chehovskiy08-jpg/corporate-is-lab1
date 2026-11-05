import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { ProductQuery } from '../lib/catalogParams'
import { api, toApiError } from './client'

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/catalog/categories/')
      if (error) throw toApiError(response, error)
      return data
    },
    staleTime: 10 * 60 * 1000,
  })

export const productsQuery = (query: ProductQuery) =>
  queryOptions({
    queryKey: ['products', 'list', query],
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET('/api/catalog/products/', {
        params: { query },
        signal,
      })
      if (error) throw toApiError(response, error)
      return data
    },
    placeholderData: keepPreviousData,
  })

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ['products', 'detail', slug],
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET('/api/catalog/products/{slug}/', {
        params: { path: { slug } },
        signal,
      })
      if (error) throw toApiError(response, error)
      return data
    },
  })

export const reviewsQuery = (slug: string) =>
  queryOptions({
    queryKey: ['products', 'detail', slug, 'reviews'],
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET('/api/catalog/products/{slug}/reviews/', {
        params: { path: { slug } },
        signal,
      })
      if (error) throw toApiError(response, error)
      return data
    },
  })
