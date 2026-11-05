import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '../api/client'

// Раскладывает ошибку DRF по полям формы; всё, что не относится к полю, — в root
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldNames: readonly Path<T>[],
) {
  if (!(error instanceof ApiError)) {
    setError('root', { message: 'Сервер недоступен. Попробуйте позже.' })
    return
  }
  let placed = false
  for (const [name, messages] of Object.entries(error.fields)) {
    if ((fieldNames as readonly string[]).includes(name)) {
      setError(name as Path<T>, { message: messages.join(' ') })
      placed = true
    }
  }
  if (!placed) setError('root', { message: error.message })
}
