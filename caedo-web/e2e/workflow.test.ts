import { test, expect } from '@playwright/test';

test.describe('End-to-End Workflow', () => {
  test('Golden Path: Design to Handoff', async ({ page }) => {
    // 1. Load Editor
    await page.goto('/');
    await expect(page).toHaveTitle(/Print-OS/);

    // 2. Add an object via AI
    const aiInput = page.locator('textarea[placeholder*="Ask AI"]');
    await aiInput.fill('create a simple cube 20mm');
    await page.keyboard.press('Enter');

    // Wait for object to appear in scene (heuristic: objects panel count)
    await expect(page.locator('[data-testid="scene-object"]')).toBeVisible({ timeout: 15000 });

    // 3. Export Design
    await page.click('button[title="Export"]');
    await expect(page.locator('text=Export Design')).toBeVisible();
    
    // Select 3MF and trigger handoff
    await page.selectOption('select[name="format"]', '3mf');
    await page.click('button:has-text("Handoff to Caedo API")');

    // 4. Verify Handoff (navigation to business page)
    await expect(page).toHaveURL(/\/business/);
    await expect(page.locator('text=Business Case Analysis')).toBeVisible();
    
    // 5. Create Job
    await page.click('button:has-text("Create Job")');
    await expect(page).toHaveURL(/\/facility/);
    await expect(page.locator('text=Job Queue')).toBeVisible();
  });
});
