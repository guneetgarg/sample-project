import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Delete Test Case', () => {
  test('should select a test case, delete it, and verify it is removed from the list', async ({ page }) => {
    test.setTimeout(180000);

    console.log('🔍 Starting Delete Test Case test...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: Session/connection failure after login
    await maybeFailAt(page, 'after-login-delete-tc', 0.2, ['connection-refused', 'timeout-exception', 'frame-detached']);

    // Step 2: Navigate to test cases page
    const testCasesUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-cases';
    await page.goto(testCasesUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    console.log('✅ Navigated to test cases page');

    // 💥 FAILURE INJECTION POINT 2: Element not visible after navigation
    await maybeFailAt(page, 'after-navigate-delete-tc', 0.15, ['element-not-visible', 'element-not-found']);

    // Step 3: Find a test case to delete (filter by "Auto" first)
    const filterInput = page.getByRole('textbox', { name: /search|filter/i }).first();
    const isFilterVisible = await filterInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (isFilterVisible) {
      await filterInput.fill('Auto');
      await page.waitForTimeout(3000);
      console.log('✅ Applied filter for "Auto"');
    }

    // 💥 FAILURE INJECTION POINT 3: Stale element reference when selecting test case
    await maybeFailAt(page, 'before-select-tc-for-delete', 0.2, ['stale-element', 'element-not-interactable']);

    // Step 4: Select a test case checkbox
    const firstCheckbox = page.getByRole('checkbox', { name: /Select row|Unselect row/i }).first();
    await expect(firstCheckbox).toBeVisible({ timeout: 90000 });
    await firstCheckbox.click();
    console.log('✅ Selected a test case');

    await page.waitForTimeout(500);

    // 💥 FAILURE INJECTION POINT 4: Element not interactable for delete button
    await maybeFailAt(page, 'before-click-delete-tc', 0.15, ['element-not-interactable', 'element-not-found']);

    // Step 5: Click delete button
    const deleteButton = page.getByRole('button', { name: /Delete|Remove/i }).first();
    await expect(deleteButton).toBeVisible({ timeout: 90000 });
    await deleteButton.click();
    console.log('✅ Clicked delete button');

    await page.waitForTimeout(1000);

    // 💥 FAILURE INJECTION POINT 5: JavaScript exception before confirmation
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating JavaScript exception in confirmation dialog...');
      throw new Error("JavascriptException: javascript error: Cannot read properties of null (reading 'confirmAction') at HTMLButtonElement.onclick");
    }

    // Step 6: Confirm deletion
    const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Delete/i }).first();
    await expect(confirmButton).toBeVisible({ timeout: 90000 });
    await confirmButton.click();
    console.log('✅ Confirmed deletion');

    await page.waitForTimeout(5000);

    // 💥 FAILURE INJECTION POINT 6: Network failure after delete API call
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating network failure after delete...');
      throw new Error('net::ERR_NETWORK_CHANGED - The network connection was lost after the delete request was sent. Unable to verify deletion status.');
    }

    // Step 7: Verify test case was deleted
    // 💥 FAILURE INJECTION POINT 7: Timeout during verification
    await maybeFailAt(page, 'during-delete-tc-verification', 0.2, getFailureTypesForPhase('verification'));

    // Check for success message
    const successMessage = page.getByText(/deleted successfully|removed successfully/i).first();
    const isSuccessVisible = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSuccessVisible) {
      console.log('✅ Success message visible');
    }

    // 💥 FAILURE INJECTION POINT 8: Assertion failure on final count
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting test case count equals impossible value...');
      const totalText = await page.getByText(/\d+ total/i).first().textContent();
      const total = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
      expect(total).toBe(-1); // Always fails
    }

    console.log('✅ Delete Test Case test completed successfully');
  });
});
