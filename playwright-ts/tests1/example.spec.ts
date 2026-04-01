import { test, expect } from '@playwright/test';

test('basic example test',{tag: '@fast',}, async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});
