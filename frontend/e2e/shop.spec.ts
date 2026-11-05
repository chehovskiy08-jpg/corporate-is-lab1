import { expect, test } from '@playwright/test'
import { loginAs } from './helpers.ts'

test('гость собирает корзину, входит и оформляет заказ', async ({ page }) => {
  await page.goto('/?category=books&in_stock=true')
  const card = page.locator('.card').first()
  const name = await card.locator('h2').innerText()
  await card.getByRole('button', { name: 'В корзину' }).click()
  await expect(page.getByRole('link', { name: /Корзина: 1 шт\./ })).toBeVisible()

  await page.getByRole('link', { name: /Корзина/ }).click()
  await page.getByRole('link', { name: 'Оформить заказ' }).click()
  await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/)

  await page.getByLabel('Имя пользователя').fill('buyer')
  await page.getByLabel('Пароль').fill('buyer12345')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page).toHaveURL('/checkout')

  await page.getByLabel('Получатель').fill('Анна Смирнова')
  await page.getByLabel('Телефон').fill('+7 913 123-45-67')
  await page.getByLabel('Электронная почта').fill('buyer@example.com')
  await page.getByRole('button', { name: 'Подтвердить заказ' }).click()

  await expect(page.getByText('Заказ оформлен. Спасибо!')).toBeVisible()
  await expect(page.getByRole('cell', { name })).toBeVisible()
})

test('менеджер подтверждает новый заказ', async ({ page }) => {
  await loginAs(page, 'manager', 'manager12345', '/manager/orders?status=new')
  const row = page.locator('.table tr').first()
  const number = await row.locator('td').first().innerText()
  await row.getByRole('button', { name: 'Подтвердить' }).click()

  await page.getByLabel('Статус').selectOption('confirmed')
  await expect(page.locator('.table tr', { hasText: number })).toContainText('Подтверждён')
})

test('покупатель не попадает в раздел менеджера', async ({ page }) => {
  await loginAs(page, 'buyer', 'buyer12345')
  await page.goto('/manager/orders')
  await expect(page.getByRole('heading', { name: 'Нет доступа' })).toBeVisible()
})
