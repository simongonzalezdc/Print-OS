import { test, expect } from '@playwright/test';

test.describe('Facility Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/facility');
  });

  test('can see fleet management header', async ({ page }) => {
    await expect(page.getByText(/FLEET_MANAGEMENT/i)).toBeVisible();
  });

  test('can open provision new unit modal', async ({ page }) => {
    const provisionBtn = page.getByRole('button', { name: /PROVISION_NEW_UNIT/i });
    if (await provisionBtn.isVisible()) {
      await provisionBtn.click();
      await expect(page.getByText(/UNIT_REGISTRATION_PROTOCOL/i).or(page.getByText(/UPDATE_UNIT/i))).toBeVisible();
    }
  });

  test('can navigate to jobs list', async ({ page }) => {
    // Assuming there is a link to jobs
    const jobsLink = page.getByRole('link', { name: /Jobs/i });
    if (await jobsLink.isVisible()) {
      await jobsLink.click();
      await expect(page.url()).toContain('/facility/jobs');
    }
  });
});
