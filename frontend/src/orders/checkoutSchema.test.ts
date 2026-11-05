import { describe, expect, test } from 'vitest'
import { checkoutSchema } from './checkoutSchema'

const valid = {
  full_name: 'Анна Смирнова',
  phone: '8 (913) 123-45-67',
  email: 'anna@example.com',
  delivery_method: 'pickup' as const,
  address: '',
  comment: '',
  promo_code: '',
}

describe('checkoutSchema', () => {
  test('самовывоз без адреса проходит', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true)
  })

  test('курьер без адреса — ошибка у поля address', () => {
    const result = checkoutSchema.safeParse({ ...valid, delivery_method: 'courier' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['address'])
  })

  test.each(['+7 913 123-45-67', '9131234567', '89131234567'])(
    'телефон %s принимается',
    (phone) => {
      expect(checkoutSchema.safeParse({ ...valid, phone }).success).toBe(true)
    },
  )

  test.each(['12345', '+1 202 555 0100'])('телефон %s отклоняется', (phone) => {
    expect(checkoutSchema.safeParse({ ...valid, phone }).success).toBe(false)
  })
})
