import type { OrderStatus } from '../api/client'

export const statusLabels: Record<OrderStatus, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  shipped: 'Передан в доставку',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

export const transitionLabels: Record<OrderStatus, string> = {
  new: 'Вернуть в новые',
  confirmed: 'Подтвердить',
  shipped: 'Передать в доставку',
  delivered: 'Отметить доставленным',
  cancelled: 'Отменить',
}
