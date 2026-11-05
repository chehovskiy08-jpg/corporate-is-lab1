import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { api, toApiError } from '../api/client'
import { meQuery } from '../auth/session'
import { cartQuery, useCart } from '../cart/useCart'
import { formatPrice } from '../lib/format'
import { applyServerErrors } from '../lib/serverErrors'
import { checkoutFields, checkoutSchema, type CheckoutForm } from './checkoutSchema'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cart = useCart()
  const { data: me } = useQuery(meQuery())
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: [me?.first_name, me?.last_name].filter(Boolean).join(' '),
      phone: '',
      email: me?.email ?? '',
      delivery_method: 'pickup',
      address: '',
      comment: '',
      promo_code: '',
    },
  })
  const delivery = useWatch({ control, name: 'delivery_method' })

  async function onSubmit(values: CheckoutForm) {
    const { data, error, response } = await api.POST('/api/orders/', { body: values })
    if (error) {
      applyServerErrors(toApiError(response, error), setError, checkoutFields)
      return
    }
    queryClient.setQueryData(cartQuery().queryKey, { items: [], count: 0, total: '0.00' })
    void queryClient.invalidateQueries({ queryKey: ['orders'] })
    navigate(`/orders/${data.id}`, { replace: true, state: { justPlaced: true } })
  }

  if (cart.items.length === 0) {
    return (
      <section className="details narrow">
        <h1>Оформление заказа</h1>
        <p className="muted">
          Корзина пуста. <Link to="/">В каталог</Link>
        </p>
      </section>
    )
  }

  return (
    <form className="details narrow form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1>Оформление заказа</h1>
      <p>
        Товаров: {cart.count} на {formatPrice(cart.total)}. Доставка курьером — 500 ₽, от 5000 ₽
        бесплатно.
      </p>
      <label>
        Получатель
        <input autoComplete="name" {...register('full_name')} />
      </label>
      {errors.full_name && <p className="error">{errors.full_name.message}</p>}
      <label>
        Телефон
        <input type="tel" autoComplete="tel" placeholder="+7 913 123-45-67" {...register('phone')} />
      </label>
      {errors.phone && <p className="error">{errors.phone.message}</p>}
      <label>
        Электронная почта
        <input type="email" autoComplete="email" {...register('email')} />
      </label>
      {errors.email && <p className="error">{errors.email.message}</p>}
      <fieldset>
        <legend>Способ получения</legend>
        <label className="inline">
          <input type="radio" value="pickup" {...register('delivery_method')} /> Самовывоз
        </label>
        <label className="inline">
          <input type="radio" value="courier" {...register('delivery_method')} /> Курьер
        </label>
      </fieldset>
      {delivery === 'courier' && (
        <>
          <label>
            Адрес доставки
            <input autoComplete="street-address" {...register('address')} />
          </label>
          {errors.address && <p className="error">{errors.address.message}</p>}
        </>
      )}
      <label>
        Промокод
        <input {...register('promo_code')} />
      </label>
      {errors.promo_code && <p className="error">{errors.promo_code.message}</p>}
      <label>
        Комментарий
        <textarea rows={3} {...register('comment')} />
      </label>
      {errors.root && (
        <p className="error" role="alert">
          {errors.root.message}
        </p>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Отправка...' : 'Подтвердить заказ'}
      </button>
    </form>
  )
}
