import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      // ошибки 4xx повторять бессмысленно: товар не появится от второй попытки
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
})
