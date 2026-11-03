import { test, expect } from '@playwright/test';

test('sanity check: opens BASE_URL and verifies page loads @smoke', async ({ page }) => {
    await page.goto('');
    await expect(page).toHaveTitle(/TodoMVC/i);
});