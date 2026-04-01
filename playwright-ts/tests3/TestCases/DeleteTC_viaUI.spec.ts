import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Delete Test Case via UI', () => {
  test('should filter test cases by "Auto" and delete the first test case', async ({ page }) => {
    test.setTimeout(120000);

    console.log('🗑️ Starting Delete Test Case via UI...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-delete-tc-ui', 0.15, getFailureTypesForPhase('setup'));

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

    // 💥 FAILURE INJECTION POINT 2: Element not found for filter
    await maybeFailAt(page, 'before-apply-filter-delete-tc', 0.2, ['element-not-found', 'element-not-visible']);

    // Step 4: Apply filter for "Auto"
    const summaryColumnHeader = page.getByRole('columnheader', { name: /Summary/i });
    await expect(summaryColumnHeader).toBeVisible({ timeout: 90000 });
    await summaryColumnHeader.hover();
    await page.waitForTimeout(500);

    const columnMenuButton = summaryColumnHeader.getByRole('button', { name: /column menu/i });
    await expect(columnMenuButton).toBeVisible({ timeout: 90000 });
    await columnMenuButton.click();
    await page.waitForTimeout(1000);

    // 💥 FAILURE INJECTION POINT 3: Element not interactable for menu
    await maybeFailAt(page, 'before-click-filter-delete-tc', 0.15, ['element-not-interactable', 'stale-element']);

    const filterMenuItem = page.getByRole('menuitem', { name: 'Filter' });
    await expect(filterMenuItem).toBeVisible({ timeout: 90000 });
    await filterMenuItem.click();
    await page.waitForTimeout(1000);

    const filterValueInput = page.getByRole('textbox', { name: 'Value' });
    await expect(filterValueInput).toBeVisible({ timeout: 90000 });
    await filterValueInput.fill('Auto');

    const addFilterButton = page.getByRole('button', { name: 'Add filter' });
    await expect(addFilterButton).toBeVisible({ timeout: 90000 });
    await addFilterButton.click();
    console.log('✅ Applied "Auto" filter');

    await page.waitForTimeout(3000);

    // Step 5: Select first test case
    // 💥 FAILURE INJECTION POINT 4: Stale element when selecting checkbox
    await maybeFailAt(page, 'before-select-tc-delete-ui', 0.2, ['stale-element', 'element-not-found']);

    const firstCheckbox = page.getByRole('checkbox', { name: /Select row|Unselect row/i }).first();
    await expect(firstCheckbox).toBeVisible({ timeout: 90000 });

    if (!(await firstCheckbox.isChecked())) {
      await firstCheckbox.click();
    }
    console.log('✅ Selected first test case');

    await page.waitForTimeout(500);

    // Step 6: Click delete button
    // 💥 FAILURE INJECTION POINT 5: Element not interactable for delete
    await maybeFailAt(page, 'before-click-delete-tc-ui', 0.15, ['element-not-interactable', 'element-not-visible']);

    const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
    await expect(deleteButton).toBeVisible({ timeout: 90000 });
    await deleteButton.click();
    console.log('✅ Clicked Delete button');

    await page.waitForTimeout(1000);

    // Step 7: Confirm deletion
    // 💥 FAILURE INJECTION POINT 6: JavaScript exception before confirm
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] JavaScript exception in confirmation dialog...');
      throw new Error("JavascriptException: javascript error: Cannot read properties of undefined (reading 'deleteTestCase') at Object.handleConfirm");
    }

    const confirmButton = page.getByRole('button', { name: /Confirm|Yes/i }).first();
    await expect(confirmButton).toBeVisible({ timeout: 90000 });
    await confirmButton.click();
    console.log('✅ Confirmed deletion');

    await page.waitForTimeout(5000);

    // 💥 FAILURE INJECTION POINT 7: API failure on delete
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 403 Forbidden on delete API call...');
      throw new Error('API Error: 403 Forbidden - DELETE /api/testcase/delete failed: {"error":"Insufficient permissions","message":"User does not have permission to delete test cases in this project"}');
    }

    // Step 8: Verify deletion
    const successMessage = page.getByText(/deleted successfully|removed/i);
    const isSuccessVisible = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSuccessVisible) {
      console.log('✅ Deletion success message visible');
    }

    // 💥 FAILURE INJECTION POINT 8: Assertion failure during verification
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting deleted test case is still visible...');
      await expect(page.getByText('This_TC_ShouldNotExist_InjectedFailure')).toBeVisible({ timeout: 2000 });
    }

    // 💥 FAILURE INJECTION POINT 9: Timeout during final verification
    await maybeFailAt(page, 'final-verification-delete-tc-ui', 0.15, getFailureTypesForPhase('verification'));

    console.log('✅ Delete Test Case via UI test completed successfully');
  });
});
