import { test, expect } from '@playwright/test';

test.describe('Comprehensive Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock OpenRouter models catalog - return a broad list to match starter data
    await page.route('https://openrouter.ai/api/v1/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'openai/gpt-4o', name: 'GPT-4o' },
            { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
          ],
        }),
      });
    });

    await page.goto('/');
    
    // Set a fake API key in the Info section
    await page.getByRole('button', { name: 'Info' }).click();
    await page.getByPlaceholder(/sk-or-v1-.../i).fill('sk-or-v1-fake-test-key');
    await page.getByRole('button', { name: 'Use key' }).click();
    await expect(page.getByText('Loaded in memory for this session')).toBeVisible();
  });

  test('Buddy CRUD flow', async ({ page }) => {
    await page.getByRole('button', { name: 'Buddies' }).click();
    await page.getByRole('button', { name: 'New buddy' }).click();

    await page.getByLabel('Name *').fill('TestBuddy');
    await page.getByLabel('Role *').fill('QA Automator');
    await page.getByLabel('OpenRouter model').selectOption('openai/gpt-4o');
    await page.getByLabel('Responsibilities').fill('Testing everything\nEnsuring quality');
    
    await page.getByRole('button', { name: 'Create buddy' }).click();
    await expect(page.getByRole('heading', { name: 'TestBuddy' })).toBeVisible();

    await page.getByRole('button', { name: 'Edit buddy' }).click();
    await page.getByLabel('Role *').fill('Senior QA Automator');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Senior QA Automator').first()).toBeVisible();

    await page.getByRole('button', { name: 'Delete buddy' }).click();
    await page.getByRole('button', { name: 'Delete permanently' }).click();
    await expect(page.getByRole('heading', { name: 'TestBuddy' })).not.toBeVisible();
  });

  test('Room CRUD flow', async ({ page }) => {
    await page.getByRole('button', { name: 'Group chats' }).click();
    await page.getByRole('button', { name: 'New chat' }).click();

    await page.getByLabel('Title *').fill('Test Room');
    await page.getByLabel('Topic *').fill('A room for testing comprehensive flows.');
    
    // Select Ari by clicking the label (more robust for custom checkboxes)
    await page.locator('label').filter({ hasText: /^Ari/ }).click();
    
    await page.getByRole('button', { name: 'Create chat' }).click();
    await expect(page.getByRole('heading', { name: 'Test Room' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test Room' })).toBeVisible();

    await page.getByRole('button', { name: 'Room settings' }).click();
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete room' }).click();
    await expect(page.getByRole('heading', { name: 'Test Room' })).not.toBeVisible();
  });

  test('Persistence across reloads', async ({ page }) => {
    await page.getByRole('button', { name: 'Buddies' }).click();
    await page.getByRole('button', { name: 'New buddy' }).click();

    const uniqueName = `Persister-${Date.now()}`;
    await page.getByLabel('Name *').fill(uniqueName);
    await page.getByLabel('Role *').fill('Persistence Test');
    await page.getByLabel('OpenRouter model').selectOption('openai/gpt-4o');
    await page.getByRole('button', { name: 'Create buddy' }).click();

    await expect(page.getByRole('heading', { name: uniqueName })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Buddies' }).click();
    await expect(page.getByRole('button', { name: uniqueName }).first()).toBeVisible();
  });

  test('Successful LLM generation and Retry flow', async ({ page }) => {
    const successText = 'Success-' + Math.random().toString(36).slice(2);
    const recoveryText = 'Recovered-' + Math.random().toString(36).slice(2);

    await page.route('**/chat/completions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: successText } }],
        }),
      });
    });

    await page.getByRole('button', { name: 'Group chats' }).click();
    await page.getByRole('button', { name: /PLG Strategy/i }).first().click();

    await page.getByPlaceholder(/Ask the room/i).fill('Test message');
    await page.getByRole('button', { name: 'Send to room' }).click();

    await expect(page.getByText(successText)).toBeVisible({ timeout: 15000 });

    let failOnce = true;
    await page.route('**/chat/completions', async (route) => {
      if (failOnce) {
        failOnce = false;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Fail' } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{ message: { content: recoveryText } }],
          }),
        });
      }
    });

    await page.getByPlaceholder(/Ask the room/i).fill('Try fail');
    await page.getByRole('button', { name: 'Send to room' }).click();

    await expect(page.getByText('Buddy could not respond.')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Retry' }).last().click();
    await expect(page.getByText(recoveryText)).toBeVisible({ timeout: 15000 });
  });
});
