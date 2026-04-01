import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Delete Single Test Group', () => {
  test('should delete a single test group by filtering and selecting it', async ({ page }) => {
    test.setTimeout(120000);

    console.log('🗑️ Starting Delete Single Test Group test...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-delete-tg', 0.15, getFailureTypesForPhase('setup'));

    // Step 2: Navigate to Test Groups page
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    await expect(page).toHaveTitle('QA Path', { timeout: 90000 });
    await expect(page.getByText(/Test Groups|Test Groups Library/i).first()).toBeVisible({ timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');

    // Step 3: Get initial count
    const initialTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const initialTotal = initialTotalText ? parseInt(initialTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Initial total test groups: ${initialTotal}`);

    // 💥 FAILURE INJECTION POINT 2: Element not found for column header
    await maybeFailAt(page, 'before-filter-delete-tg', 0.2, ['element-not-found', 'element-not-visible']);

    // Step 4: Apply filter for "TestGroupwithTestCase-"
    const groupNameColumnHeader = page.getByRole('columnheader', { name: /Group Name & Description/i });
    await expect(groupNameColumnHeader).toBeVisible({ timeout: 90000 });
    await groupNameColumnHeader.hover();
    await page.waitForTimeout(500);

    const columnMenuButton = groupNameColumnHeader.getByRole('button', { name: /column menu/i });
    await expect(columnMenuButton).toBeVisible({ timeout: 90000 });
    await columnMenuButton.click();
    await page.waitForTimeout(1000);

    const filterMenuItem = page.getByRole('menuitem', { name: 'Filter' });
    await expect(filterMenuItem).toBeVisible({ timeout: 90000 });
    await filterMenuItem.click();
    await page.waitForTimeout(1000);

    // 💥 FAILURE INJECTION POINT 3: Stale element for filter input
    await maybeFailAt(page, 'before-enter-filter-delete-tg', 0.15, ['stale-element', 'element-not-interactable']);

    const filterValueInput = page.getByRole('textbox', { name: 'Value' });
    await expect(filterValueInput).toBeVisible({ timeout: 90000 });
    await filterValueInput.fill('TestGroupwithTestCase-');
    console.log('✅ Entered filter value');

    const filterResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/testgroup/list') || url.includes('/api/testgroup/getAll')) && response.status() === 200;
      },
      { timeout: 30000 }
    ).catch(() => null);

    const addFilterButton = page.getByRole('button', { name: 'Add filter' });
    await expect(addFilterButton).toBeVisible({ timeout: 90000 });
    await addFilterButton.click();
    console.log('✅ Applied filter');

    try {
      await filterResponsePromise;
    } catch (error) {
      console.log('⚠️ Filter API call may have already completed');
    }

    await page.waitForTimeout(2000);

    // 💥 FAILURE INJECTION POINT 4: Timeout waiting for filter results
    await maybeFailAt(page, 'waiting-filter-results-delete-tg', 0.15, ['timeout-exception', 'connection-refused']);

    // Step 5: Find matching row
    let firstMatchingRow = page.getByRole('row').filter({ hasText: /TestGroupwithTestCase-/i }).first();
    const maxRetries = 5;
    let rowFound = false;

    for (let i = 0; i < maxRetries; i++) {
      const rowVisible = await firstMatchingRow.isVisible({ timeout: 3000 }).catch(() => false);
      if (rowVisible) {
        rowFound = true;
        console.log(`✅ Matching row found (attempt ${i + 1})`);
        break;
      } else {
        await page.waitForTimeout(2000 * (i + 1));
        firstMatchingRow = page.getByRole('row').filter({ hasText: /TestGroupwithTestCase-/i }).first();
      }
    }

    if (!rowFound) {
      throw new Error('No matching test groups found with prefix "TestGroupwithTestCase-"');
    }

    // Step 6: Select checkbox
    // 💥 FAILURE INJECTION POINT 5: Element not interactable for checkbox
    await maybeFailAt(page, 'before-select-checkbox-delete-tg', 0.2, ['element-not-interactable', 'stale-element']);

    const testGroupName = await firstMatchingRow.getByText(/TestGroupwithTestCase-[\d-]+/i).first().textContent();
    console.log(`📝 Found test group to delete: ${testGroupName}`);

    const checkbox = firstMatchingRow.getByRole('checkbox', { name: /Select row|Unselect row/i });
    await expect(checkbox).toBeVisible({ timeout: 90000 });
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
      await expect(checkbox).toBeChecked({ timeout: 5000 });
    }
    console.log('✅ Selected test group checkbox');

    await page.waitForTimeout(500);

    // Step 7: Click delete button
    const deleteButton = page.getByRole('button', { name: 'Delete selected group(s)' });
    await expect(deleteButton).toBeVisible({ timeout: 90000 });
    await expect(deleteButton).toBeEnabled({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 6: JavaScript exception before delete
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] JavaScript exception before delete action...');
      throw new Error("JavascriptException: javascript error: Uncaught ReferenceError: deleteHandler is not defined at HTMLButtonElement.onclick");
    }

    await deleteButton.click();
    console.log('✅ Clicked Delete button');

    // Step 8: Confirm deletion
    const confirmDialogText = page.getByText(/Delete Test Group|Are you sure you want to delete/i).first();
    await expect(confirmDialogText).toBeVisible({ timeout: 90000 });

    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    await expect(confirmButton).toBeVisible({ timeout: 90000 });
    await expect(confirmButton).toBeEnabled({ timeout: 90000 });
    await confirmButton.click();
    console.log('✅ Confirmed deletion');

    // 💥 FAILURE INJECTION POINT 7: Network failure after delete
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Network failure after delete API call...');
      throw new Error('net::ERR_CONNECTION_RESET - The connection was reset during the delete operation. Unable to confirm deletion status.');
    }

    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Step 9: Verify deletion
    // 💥 FAILURE INJECTION POINT 8: Assertion failure during verification
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting deleted group is still visible...');
      if (testGroupName) {
        await expect(page.getByText(testGroupName)).toBeVisible({ timeout: 2000 });
      }
    }

    // Refresh page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 9: Final verification
    await maybeFailAt(page, 'final-verification-delete-tg', 0.15, getFailureTypesForPhase('verification'));

    // Verify deleted group is gone
    if (testGroupName) {
      const deletedGroupVisible = await page.getByText(testGroupName).isVisible({ timeout: 5000 }).catch(() => false);
      expect(deletedGroupVisible).toBeFalsy();
      console.log(`✅ Test group "${testGroupName}" is no longer visible`);
    }

    console.log('✅ Delete Single Test Group test completed successfully');
  });
});
