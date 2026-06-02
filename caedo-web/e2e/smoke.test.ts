import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Caedo/);
});

test('can open AI panel', async ({ page }) => {
  await page.goto('/');
  const aiButton = page.getByRole('button', { name: /AI/i });
  if (await aiButton.isVisible()) {
    await aiButton.click();
    await expect(page.getByText('AI_DESIGN_CORE')).toBeVisible();
  }
});

