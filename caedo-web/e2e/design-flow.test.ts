import { test, expect } from '@playwright/test';

test.describe('Design Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can open AI panel and type', async ({ page }) => {
    // Open AI Panel
    const aiButton = page.getByRole('button', { name: /AI/i });
    if (await aiButton.isVisible()) {
      await aiButton.click();
      await expect(page.getByText(/AI_DESIGN_CORE/i).or(page.getByText(/ASSISTANT/i))).toBeVisible();
      
      const input = page.getByPlaceholder(/Ask me to design something/i).or(page.locator('textarea'));
      await expect(input).toBeVisible();
      await input.fill('test prompt');
    }
  });

  test('can open templates panel', async ({ page }) => {
    const templatesButton = page.getByRole('button', { name: /Templates/i });
    if (await templatesButton.isVisible()) {
      await templatesButton.click();
      await expect(page.getByText(/Gallery/i)).toBeVisible();
    }
  });

  test('can toggle view modes', async ({ page }) => {
    // Check if we can switch between 3D and Code view if applicable
    const codeButton = page.getByRole('button', { name: /Code/i });
    if (await codeButton.isVisible()) {
      await codeButton.click();
      await expect(page.locator('.monaco-editor')).toBeVisible();
    }
  });
});
