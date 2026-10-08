import { test, expect } from '@playwright/test';

test('renders the application shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app')).not.toBeEmpty();
});
