// flaky-login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login and see dashboard (FLAKY)', async ({ page }) => {
  await page.goto('https://example.com/login');

  await page.fill('#username', 'testuser');
  await page.fill('#password', 'password123');

  await page.click('#login');

  // ❌ Hard wait – sometimes not enough, sometimes wasted
  await page.waitForTimeout(2000);

  // ❌ Dashboard may not be rendered yet
  const welcomeText = await page.textContent('#welcome-message');

  // ❌ textContent can be null if element not attached yet
  expect(welcomeText).toContain('Welcome');
});
