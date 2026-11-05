import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toApiError, type Cart, type CartItem, type Product } from '../api/client'
import { meQuery } from '../auth/session'
import { guestCart, useGuestCart } from './guestCart'

export const cartQuery = () =>
  queryOptions({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/cart/')
      if (error) throw toApiError(response, error)
      return data
    },
  })

export type CartState = {
  items: CartItem[]
  count: number
  total: string
  isGuest: boolean
  add: (product: Product) => void
  setQuantity: (productId: number, quantity: number) => void
  error: Error | null
}

export function useCart(): CartState {
  const queryClient = useQueryClient()
  const { data: me } = useQuery(meQuery())
  const isGuest = !me
  const guestItems = useGuestCart()
  const server = useQuery({ ...cartQuery(), enabled: !isGuest })

  const addMutation = useMutation({
    mutationFn: async (product: Product) => {
      const { data, error, response } = await api.POST('/api/cart/items/', {
        body: { product: product.id, quantity: 1 },
      })
      if (error) throw toApiError(response, error)
      return data
    },
    onSuccess: (cart) => queryClient.setQueryData(cartQuery().queryKey, cart),
  })

  const quantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const { data, error, response } = await api.PATCH('/api/cart/items/{product_id}/', {
        params: { path: { product_id: productId } },
        body: { quantity },
      })
      if (error) throw toApiError(response, error)
      return data
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartQuery().queryKey })
      const previous = queryClient.getQueryData<Cart>(cartQuery().queryKey)
      if (previous) {
        queryClient.setQueryData<Cart>(cartQuery().queryKey, {
          ...previous,
          items: previous.items
            .map((item) => (item.product_id === productId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        })
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(cartQuery().queryKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartQuery().queryKey }),
  })

  if (isGuest) {
    return {
      items: guestItems,
      count: guestItems.reduce((sum, item) => sum + item.quantity, 0),
      total: guestItems.reduce((sum, item) => sum + Number(item.total), 0).toFixed(2),
      isGuest,
      add: (product) => guestCart.add(product),
      setQuantity: (productId, quantity) => guestCart.setQuantity(productId, quantity),
      error: null,
    }
  }

  return {
    items: server.data?.items ?? [],
    count: server.data?.count ?? 0,
    total: server.data?.total ?? '0',
    isGuest,
    add: (product) => addMutation.mutate(product),
    setQuantity: (productId, quantity) => quantityMutation.mutate({ productId, quantity }),
    error: addMutation.error ?? quantityMutation.error,
  }
}
