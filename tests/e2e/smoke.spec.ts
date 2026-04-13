import { expect, test } from '@playwright/test'

test('shows the group chat workspace shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Group chats' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'PLG Strategy' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send to room' })).toBeVisible()
  await expect(page).toHaveURL(/#\/chats\/chat-plg$/)
})

test('updates the hash route when switching sections', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /Pricing Narrative/i }).click()
  await expect(page).toHaveURL(/#\/chats\/chat-pricing$/)

  await page.getByLabel('Buddies', { exact: true }).click()
  await expect(page).toHaveURL(/#\/buddies\/buddy-cto$/)

  await page.getByLabel('Info', { exact: true }).click()
  await expect(page).toHaveURL(/#\/info$/)
})

test('adds a buddy to an existing room without allowing removals', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /Pricing Narrative/i }).click()
  await expect(page.getByRole('heading', { name: 'Pricing Narrative' })).toBeVisible()

  await page.getByRole('button', { name: 'Add buddies' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Existing room buddies are locked in place.')
  await expect(dialog.getByRole('checkbox', { name: /Ari/i })).toBeEnabled()
  await expect(dialog.getByRole('checkbox', { name: /Mina/i })).toBeDisabled()
  await expect(dialog.getByRole('checkbox', { name: /Niko/i })).toBeDisabled()

  await dialog.getByRole('checkbox', { name: /Ari/i }).check()
  await dialog.getByRole('button', { name: 'Add selected buddies' }).click()

  await expect(page.getByText('Added 1 buddy to this room.')).toBeVisible()

  await page.getByRole('button', { name: 'Add buddies' }).click()
  await expect(page.getByRole('dialog').getByRole('checkbox', { name: /Ari/i })).toBeDisabled()
})
