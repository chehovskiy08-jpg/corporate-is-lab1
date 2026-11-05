import { expect, type Page } from '@playwright/test'

export async function loginAs(page: Page, username: string, password: string, next = '/') {
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.getByLabel('Имя пользователя').fill(username)
  await page.getByLabel('Пароль').fill(password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible()
}
