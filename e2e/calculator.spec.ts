import { expect, test } from '@playwright/test'

test.describe('margin-genie calculator', () => {
  test('loads landing and calculator sections', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/마진지니/)
    await expect(page.getByRole('heading', { name: /팔기 전에 계산하는/ })).toBeVisible()
    await page.locator('#calculator').scrollIntoViewIfNeeded()
    await expect(page.getByRole('heading', { name: '빠른 계산' })).toBeVisible()
  })

  test('shows live margin result and channel compare', async ({ page }) => {
    await page.goto('/#calculator')
    await expect(page.getByTestId('margin-result-profit')).toBeVisible()
    await expect(page.getByTestId('channel-compare')).toBeVisible()
    await expect(page.getByTestId('sensitivity-panel')).toBeVisible()
    await expect(page.getByTestId('pro-account-panel')).toBeVisible()
    await expect(page.getByTestId('ai-explain-panel')).toBeVisible()
  })

  test('activates pro trial and shows full ai explanation', async ({ page }) => {
    await page.goto('/#pro')
    await page.getByPlaceholder('you@shop.com').fill('pro-e2e@shop.com')
    await page.getByPlaceholder('예: Gong').fill('E2E Tester')
    await page.getByRole('button', { name: 'Pro 체험 시작' }).click()
    await expect(page.getByText('Pro 활성')).toBeVisible()
    await expect(page.getByText('다음 행동')).toBeVisible()
  })

  test('recalculates when list price changes', async ({ page }) => {
    await page.goto('/#calculator')
    const profit = page.getByTestId('margin-result-profit')
    const before = await profit.textContent()
    await page.getByRole('textbox', { name: '판매가' }).fill('120000')
    await expect(profit).not.toHaveText(before ?? '')
  })
})
