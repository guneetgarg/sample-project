import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Filter Test by Summary', () => {
  test('should filter test cases by Summary column with "Auto" value and reset filter', async ({ page }) => {
    test.setTimeout(120000);

    console.log('🔍 Starting Filter Test by Summary...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: Connection error after login
    await maybeFailAt(page, 'after-login-filter-summary', 0.15, ['connection-refused', 'timeout-exception']);

    // Step 2: Navigate to test cases page
    const testCasesUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-cases';
    await page.goto(testCasesUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    console.log('✅ Navigated to test cases page');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout
    await maybeFailAt(page, 'after-navigate-filter-summary', 0.15, getFailureTypesForPhase('navigation'));

    // Step 3: Get initial count
    const initialTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const initialTotal = initialTotalText ? parseInt(initialTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Initial total: ${initialTotal}`);

    // Step 4: Open filter on Summary column
    const summaryColumnHeader = page.getByRole('columnheader', { name: /Summary/i });
    await expect(summaryColumnHeader).toBeVisible({ timeout: 90000 });
    await summaryColumnHeader.hover();
    await page.waitForTimeout(500);

    // 💥 FAILURE INJECTION POINT 3: Element not found for column menu
    await maybeFailAt(page, 'before-open-column-menu', 0.2, ['element-not-found', 'element-not-visible']);

    const columnMenuButton = summaryColumnHeader.getByRole('button', { name: /column menu/i });
    await expect(columnMenuButton).toBeVisible({ timeout: 90000 });
    await columnMenuButton.click();
    await page.waitForTimeout(1000);

    const filterMenuItem = page.getByRole('menuitem', { name: 'Filter' });
    await expect(filterMenuItem).toBeVisible({ timeout: 90000 });
    await filterMenuItem.click();
    await page.waitForTimeout(1000);
    console.log('✅ Opened filter panel');

    // Step 5: Enter "Auto" value
    // 💥 FAILURE INJECTION POINT 4: Stale element for filter input
    await maybeFailAt(page, 'before-enter-filter-value', 0.15, ['stale-element', 'element-not-interactable']);

    const filterValueInput = page.getByRole('textbox', { name: 'Value' });
    await expect(filterValueInput).toBeVisible({ timeout: 90000 });
    await filterValueInput.fill('Auto');
    console.log('✅ Entered "Auto" filter value');

    // Step 6: Apply filter
    const addFilterButton = page.getByRole('button', { name: 'Add filter' });
    await expect(addFilterButton).toBeVisible({ timeout: 90000 });
    await addFilterButton.click();
    console.log('✅ Applied filter');

    await page.waitForTimeout(3000);

    // 💥 FAILURE INJECTION POINT 5: API failure response for filter
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 504 Gateway Timeout on filter API...');
      throw new Error('API Error: 504 Gateway Timeout - GET /api/testcase/list?filter=Auto timed out after 30000ms. The database query took too long.');
    }

    // Step 7: Verify filtered results
    const filteredTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const filteredTotal = filteredTotalText ? parseInt(filteredTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Filtered total: ${filteredTotal}`);

    expect(filteredTotal).toBeLessThanOrEqual(initialTotal);

    // 💥 FAILURE INJECTION POINT 6: Assertion failure on filtered results
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting filtered results contain unexpected text...');
      await expect(page.getByText('NonExistentFilterResult_InjectedFailure')).toBeVisible({ timeout: 2000 });
    }

    // Step 8: Clear filter
    // 💥 FAILURE INJECTION POINT 7: Element not found for clear button
    await maybeFailAt(page, 'before-clear-filter-summary', 0.15, ['element-not-found', 'frame-detached']);

    const filterIndicatorButton = page.getByRole('button', { name: /Show filters|active filter/i }).first();
    const isFilterBtnVisible = await filterIndicatorButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isFilterBtnVisible) {
      await filterIndicatorButton.click();
      await page.waitForTimeout(1000);
    }

    const removeAllButton = page.getByRole('button', { name: 'Remove all' });
    const isRemoveVisible = await removeAllButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (isRemoveVisible) {
      await removeAllButton.click();
      console.log('✅ Cleared filter');
    }

    await page.waitForTimeout(3000);

    // Step 9: Verify count restored
    const clearedTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const clearedTotal = clearedTotalText ? parseInt(clearedTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Total after clearing: ${clearedTotal}`);

    expect(clearedTotal).toBeGreaterThanOrEqual(filteredTotal);

    // 💥 FAILURE INJECTION POINT 8: Final verification timeout
    await maybeFailAt(page, 'final-verification-filter-summary', 0.15, getFailureTypesForPhase('verification'));

    console.log('✅ Filter Test by Summary test completed successfully');
  });
});
