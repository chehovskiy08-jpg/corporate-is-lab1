import { z } from 'zod'

// Повторяет правила сервера (orders/validators.py, services.place_order).
// Это удобство для покупателя, а проверяет всё равно сервер
function isRussianPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return (
    (digits.length === 11 && '78'.includes(digits[0])) ||
    (digits.length === 10 && digits[0] === '9')
  )
}

export const checkoutSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Укажите имя получателя'),
    phone: z.string().refine(isRussianPhone, 'Введите российский номер, например +7 913 123-45-67'),
    email: z.string().email('Введите адрес почты'),
    delivery_method: z.enum(['pickup', 'courier']),
    address: z.string().trim(),
    comment: z.string().max(500, 'Не длиннее 500 символов'),
    promo_code: z.string().trim().max(30),
  })
  .superRefine((values, ctx) => {
    if (values.delivery_method === 'courier' && values.address === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Для доставки курьером укажите адрес',
      })
    }
  })

export type CheckoutForm = z.infer<typeof checkoutSchema>

export const checkoutFields = [
  'full_name',
  'phone',
  'email',
  'delivery_method',
  'address',
  'comment',
  'promo_code',
] as const satisfies readonly (keyof CheckoutForm)[]
