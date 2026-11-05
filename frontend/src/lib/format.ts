const priceFormat = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

// DRF отдаёт Decimal строкой ("1390.00"): число нужно только для показа, считает деньги сервер
export function formatPrice(value: string): string {
  return priceFormat.format(Number(value))
}
