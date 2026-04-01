import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Filter Test Cases by Summary - Auto', () => {
  test('should filter test cases by Summary with "Auto" value, get count, and clear filter', async ({ page }) => {
    test.setTimeout(120000);

    console.log('🔍 Starting Filter Test Cases by Summary - Auto...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-filter-tc', 0.15, getFailureTypesForPhase('setup'));

    // Step 2: Navigate to test cases page
    const testCasesUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-cases';
    await page.goto(testCasesUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    console.log('✅ Navigated to test cases page');

    // Step 3: Get initial count
    const initialTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const initialTotal = initialTotalText ? parseInt(initialTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Initial total: ${initialTotal}`);

    // 💥 FAILURE INJECTION POINT 2: Element not found for column header
    await maybeFailAt(page, 'before-filter-summary-column', 0.2, ['element-not-found', 'element-not-visible']);

    // Step 4: Hover over Summary column header
    const summaryColumnHeader = page.getByRole('columnheader', { name: /Summary/i });
    await expect(summaryColumnHeader).toBeVisible({ timeout: 90000 });
    await summaryColumnHeader.hover();
    await page.waitForTimeout(500);

    // Step 5: Click column menu button
    const columnMenuButton = summaryColumnHeader.getByRole('button', { name: /column menu/i });
    await expect(columnMenuButton).toBeVisible({ timeout: 90000 });
    await columnMenuButton.click();
    console.log('✅ Clicked column menu');

    await page.waitForTimeout(1000);

    // 💥 FAILURE INJECTION POINT 3: Element not interactable for filter menu
    await maybeFailAt(page, 'before-click-filter-menu', 0.15, ['element-not-interactable', 'stale-element']);

    // Step 6: Click Filter
    const filterMenuItem = page.getByRole('menuitem', { name: 'Filter' });
    await expect(filterMenuItem).toBeVisible({ timeout: 90000 });
    await filterMenuItem.click();
    console.log('✅ Clicked Filter menu item');

    await page.waitForTimeout(1000);

    // Step 7: Enter filter value "Auto"
    const filterValueInput = page.getByRole('textbox', { name: 'Value' });
    await expect(filterValueInput).toBeVisible({ timeout: 90000 });
    await filterValueInput.fill('Auto');
    console.log('✅ Entered "Auto" in filter');

    // 💥 FAILURE INJECTION POINT 4: Timeout before applying filter
    await maybeFailAt(page, 'before-apply-filter', 0.15, ['timeout-exception', 'stale-element']);

    // Step 8: Click Add filter
    const addFilterButton = page.getByRole('button', { name: 'Add filter' });
    await expect(addFilterButton).toBeVisible({ timeout: 90000 });
    await addFilterButton.click();
    console.log('✅ Clicked Add filter');

    await page.waitForTimeout(3000);

    // Step 9: Verify filter applied
    const filteredTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const filteredTotal = filteredTotalText ? parseInt(filteredTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Filtered total: ${filteredTotal}`);

    // 💥 FAILURE INJECTION POINT 5: Assertion failure on filtered count
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting filtered count equals impossible value...');
      expect(filteredTotal).toBe(initialTotal + 1000);
    }

    expect(filteredTotal).toBeLessThanOrEqual(initialTotal);
    console.log('✅ Filtered count is valid');

    // Step 10: Clear filter
    // 💥 FAILURE INJECTION POINT 6: Frame detached before clearing filter
    await maybeFailAt(page, 'before-clear-filter', 0.15, ['frame-detached', 'connection-refused']);

    const filterIndicatorButton = page.getByRole('button', { name: /Show filters|active filter/i }).first();
    const filterButtonVisible = await filterIndicatorButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (filterButtonVisible) {
      await filterIndicatorButton.click();
      await page.waitForTimeout(1000);
    }

    const removeAllButton = page.getByRole('button', { name: 'Remove all' });
    const removeVisible = await removeAllButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (removeVisible) {
      await removeAllButton.click();
      console.log('✅ Cleared filter');
    }

    await page.waitForTimeout(3000);

    // Step 11: Verify count restored
    const clearedTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const clearedTotal = clearedTotalText ? parseInt(clearedTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Total after clearing: ${clearedTotal}`);

    // 💥 FAILURE INJECTION POINT 7: Final verification failure
    await maybeFailAt(page, 'final-verification-filter-tc', 0.15, getFailureTypesForPhase('verification'));

    expect(clearedTotal).toBeGreaterThanOrEqual(filteredTotal);
    console.log('✅ Filter Test Cases by Summary - Auto test completed successfully');
  });
});
