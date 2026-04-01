import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Filter Test Group', () => {
  test('should filter test groups by name prefix and verify filtered results', async ({ page }) => {
    test.setTimeout(120000);

    console.log('🔍 Starting Filter Test Group test...');

    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-filter-tg', 0.15, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Navigate to Test Groups Page
    // ============================================
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    await expect(page).toHaveTitle('QA Path', { timeout: 90000 });
    await expect(page.getByText(/Test Groups|Test Groups Library/i).first()).toBeVisible({ timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout
    await maybeFailAt(page, 'after-navigate-filter-tg', 0.15, getFailureTypesForPhase('navigation'));

    // ============================================
    // SECTION 3: Get Initial Count
    // ============================================
    const initialTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const initialTotal = initialTotalText ? parseInt(initialTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Initial total: ${initialTotal}`);

    const filterPrefix = 'TestGroupCreatedbyAutomation';

    // ============================================
    // SECTION 4: Apply Filter
    // ============================================
    const groupNameColumnHeader = page.getByRole('columnheader', { name: /Group Name & Description/i });
    await expect(groupNameColumnHeader).toBeVisible({ timeout: 90000 });
    await groupNameColumnHeader.click();
    await page.waitForTimeout(1000);

    // 💥 FAILURE INJECTION POINT 3: Element not found for column menu
    await maybeFailAt(page, 'before-open-filter-menu-tg', 0.2, ['element-not-found', 'element-not-visible']);

    const columnMenuButton = groupNameColumnHeader.getByRole('button', { name: /column menu/i });
    const menuButtonVisible = await columnMenuButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (menuButtonVisible) {
      await columnMenuButton.click();
      await page.waitForTimeout(1000);
    }

    const filterMenuItem = page.getByRole('menuitem', { name: 'Filter' });
    await expect(filterMenuItem).toBeVisible({ timeout: 90000 });
    await filterMenuItem.click();
    await page.waitForTimeout(1000);

    // 💥 FAILURE INJECTION POINT 4: Stale element for filter input
    await maybeFailAt(page, 'before-enter-filter-tg', 0.15, ['stale-element', 'element-not-interactable']);

    const filterResponsePromise = page.waitForResponse(
      response => (response.url().includes('/api/testgroup')) && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);

    const valueTextbox = page.getByRole('textbox', { name: 'Value' }).first();
    await expect(valueTextbox).toBeVisible({ timeout: 90000 });
    await valueTextbox.fill(filterPrefix);
    console.log(`✅ Entered filter: ${filterPrefix}`);

    const addFilterButton = page.getByRole('button', { name: 'Add filter' });
    await expect(addFilterButton).toBeVisible({ timeout: 90000 });
    await addFilterButton.click();
    console.log('✅ Applied filter');

    try { await filterResponsePromise; } catch { }

    await page.waitForTimeout(3000);

    // 💥 FAILURE INJECTION POINT 5: API failure on filter
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 502 Bad Gateway on filter API...');
      throw new Error('API Error: 502 Bad Gateway - GET /api/testgroup/list?filter=TestGroupCreatedbyAutomation failed. The upstream server did not respond.');
    }

    // ============================================
    // SECTION 5: Verify Filter Results
    // ============================================
    const filteredTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const filteredTotal = filteredTotalText ? parseInt(filteredTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Filtered total: ${filteredTotal}`);

    expect(filteredTotal).toBeLessThanOrEqual(initialTotal);

    // 💥 FAILURE INJECTION POINT 6: Assertion failure on filter results
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting filtered count exceeds initial...');
      expect(filteredTotal).toBeGreaterThan(initialTotal + 100);
    }

    // Check for matching rows
    const noResultsMessage = page.getByText(/No results found/i);
    const noResultsVisible = await noResultsMessage.isVisible({ timeout: 2000 }).catch(() => false);

    if (!noResultsVisible) {
      const firstMatchingRow = page.getByRole('row').filter({ hasText: filterPrefix }).first();
      const isRowVisible = await firstMatchingRow.isVisible({ timeout: 5000 }).catch(() => false);
      if (isRowVisible) {
        const rowText = await firstMatchingRow.textContent();
        expect(rowText).toContain('Static');
        console.log('✅ Matching rows found with expected details');
      }
    }

    // ============================================
    // SECTION 6: Clear Filter
    // ============================================
    // 💥 FAILURE INJECTION POINT 7: Frame detached before clear
    await maybeFailAt(page, 'before-clear-filter-tg', 0.15, ['frame-detached', 'connection-refused']);

    const filterIndicatorButton = page.getByRole('button', { name: /Show filters|active filter/i }).first();
    const filterButtonVisible = await filterIndicatorButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (filterButtonVisible) {
      await filterIndicatorButton.click();
      await page.waitForTimeout(1000);
    } else {
      await groupNameColumnHeader.click();
      await page.waitForTimeout(1000);
    }

    const removeAllButton = page.getByRole('button', { name: 'Remove all' });
    await expect(removeAllButton).toBeVisible({ timeout: 90000 });
    await removeAllButton.click();
    console.log('✅ Cleared filters');

    await page.waitForTimeout(3000);

    // Verify count restored
    const clearedTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const clearedTotal = clearedTotalText ? parseInt(clearedTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Total after clearing: ${clearedTotal}`);

    expect(clearedTotal).toBeGreaterThanOrEqual(filteredTotal);

    // 💥 FAILURE INJECTION POINT 8: Final verification timeout
    await maybeFailAt(page, 'final-verification-filter-tg', 0.15, getFailureTypesForPhase('verification'));

    console.log('✅ Filter Test Group test completed successfully');
  });
});
