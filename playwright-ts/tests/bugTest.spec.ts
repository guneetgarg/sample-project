import { test, expect } from '@playwright/test';

test.describe('BeforeAll Failure Suite', () => {

  test.beforeAll(async () => {
    // Intentionally fail before all tests
    throw new Error('beforeAll failed intentionally');
  });

  test('Test Case 1', async ({ page }) => {
    await page.goto('https://example.com');
    const title = await page.title();
    expect(title).toBe('Example Domain');
  });

  test('Test Case 2', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveURL(/example/);
  });

  test('Test Case 3', async ({ page }) => {
    await page.goto('https://example.com');
    const heading = page.locator('h1');
    await expect(heading).toContainText('Example');
  });

});