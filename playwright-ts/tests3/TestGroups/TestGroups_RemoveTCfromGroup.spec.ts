import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Test Groups - Remove Test Case from Group', () => {
  test('should add a test case, then remove it from the group and verify removal', async ({ page }) => {
    test.setTimeout(180000);

    console.log('➖ Starting Test Groups - Remove TC from Group test...');

    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-remove-tc-tg', 0.15, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Navigate and Create Test Group
    // ============================================
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');

    // 💥 FAILURE INJECTION POINT 2: Navigation failure
    await maybeFailAt(page, 'after-navigate-remove-tc-tg', 0.15, getFailureTypesForPhase('navigation'));

    // Generate dynamic name
    const groupName = await page.evaluate(() => {
      const now = new Date();
      const dateTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      return `RemoveTCGroup-${dateTimestamp}`;
    });

    // Create test group
    const newButton = page.getByRole('button', { name: 'New Test Group' });
    await expect(newButton).toBeVisible({ timeout: 90000 });
    await newButton.click();
    await page.waitForTimeout(1000);

    const nameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(nameInput).toBeVisible({ timeout: 90000 });
    await nameInput.fill(groupName);

    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeVisible({ timeout: 90000 });
    await createButton.click();
    await page.waitForTimeout(6000);
    console.log(`✅ Created test group: ${groupName}`);

    // ============================================
    // SECTION 3: Add Test Case to Group
    // ============================================
    await expect(page).toHaveURL(new RegExp('/test-groups/'), { timeout: 90000 });

    const testCasesTab = page.getByRole('tab', { name: /Test Cases/i });
    await expect(testCasesTab).toBeVisible({ timeout: 90000 });
    await testCasesTab.click();
    await page.waitForTimeout(3000);

    // 💥 FAILURE INJECTION POINT 3: Element not found for add button
    await maybeFailAt(page, 'before-add-tc-remove-group', 0.2, ['element-not-found', 'element-not-visible']);

    const addButton = page.getByRole('button', { name: /Add Test Case|Add/i }).first();
    await expect(addButton).toBeVisible({ timeout: 90000 });
    await addButton.click();
    await page.waitForTimeout(3000);

    // Select a test case
    const testCaseOption = page.getByText(/QAPA-31|QAPA-/i).first();
    const isOptionVisible = await testCaseOption.isVisible({ timeout: 10000 }).catch(() => false);
    if (isOptionVisible) {
      await testCaseOption.click();
      await page.waitForTimeout(1000);
    }

    const confirmAddButton = page.getByRole('button', { name: /Add|Confirm|Save/i }).first();
    const isConfirmVisible = await confirmAddButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (isConfirmVisible) {
      await confirmAddButton.click();
      await page.waitForTimeout(3000);
    }
    console.log('✅ Added test case to group');

    // 💥 FAILURE INJECTION POINT 4: Stale element after add
    await maybeFailAt(page, 'after-add-tc-remove-group', 0.15, ['stale-element', 'element-not-interactable']);

    // Verify test case was added
    const addedTC = page.getByText(/QAPA-/i).first();
    await expect(addedTC).toBeVisible({ timeout: 30000 });

    // ============================================
    // SECTION 4: Remove Test Case from Group
    // ============================================
    console.log('📋 Removing test case from group...');

    // Select the test case checkbox
    const tcCheckbox = page.getByRole('checkbox', { name: /Select row|Unselect row/i }).first();
    await expect(tcCheckbox).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 5: Element not interactable for checkbox
    await maybeFailAt(page, 'before-select-tc-remove', 0.2, ['element-not-interactable', 'element-not-found']);

    await tcCheckbox.click();
    console.log('✅ Selected test case for removal');

    await page.waitForTimeout(500);

    // Click remove button
    const removeButton = page.getByRole('button', { name: /Remove|Delete|Remove from group/i }).first();
    await expect(removeButton).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 6: JavaScript exception before remove
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] JavaScript exception before remove action...');
      throw new Error("JavascriptException: javascript error: Cannot read properties of undefined (reading 'splice') at Array.removeItem");
    }

    await removeButton.click();
    console.log('✅ Clicked Remove button');

    await page.waitForTimeout(1000);

    // Confirm removal
    const confirmRemoveButton = page.getByRole('button', { name: /Confirm|Yes|Remove/i }).first();
    const isConfirmRemoveVisible = await confirmRemoveButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (isConfirmRemoveVisible) {
      await confirmRemoveButton.click();
      await page.waitForTimeout(3000);
    }

    // 💥 FAILURE INJECTION POINT 7: API failure on remove
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 500 error on remove test case from group...');
      throw new Error('API Error: 500 Internal Server Error - DELETE /api/testgroup/removeTestCase failed: {"error":"Constraint violation","message":"Cannot remove test case that is part of an active launch"}');
    }

    // ============================================
    // SECTION 5: Verify Removal
    // ============================================
    // 💥 FAILURE INJECTION POINT 8: Verification failure
    await maybeFailAt(page, 'during-remove-tc-verification', 0.2, getFailureTypesForPhase('verification'));

    // Verify test case count updated
    const noTestCasesMessage = page.getByText(/No test cases|0 Test Cases|empty/i).first();
    const isNoTCVisible = await noTestCasesMessage.isVisible({ timeout: 10000 }).catch(() => false);
    if (isNoTCVisible) {
      console.log('✅ Test case count shows 0 after removal');
    }

    // Verify the removed test case is no longer visible
    const removedTC = page.getByText(/QAPA-31/i);
    const isStillVisible = await removedTC.isVisible({ timeout: 5000 }).catch(() => false);

    // 💥 FAILURE INJECTION POINT 9: Assertion failure - checking removed TC is still there
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting removed test case is still visible...');
      expect(isStillVisible).toBeTruthy();
    }

    expect(isStillVisible).toBeFalsy();
    console.log('✅ Test case removed successfully');

    // 💥 FAILURE INJECTION POINT 10: Connection error on final check
    await maybeFailAt(page, 'final-verification-remove-tc', 0.1, ['connection-refused', 'timeout-exception']);

    console.log('✅ Test Groups - Remove TC from Group test completed successfully');
  });
});
