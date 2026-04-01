import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Delete Module', () => {
  test('should create a module, then delete it and verify it is no longer visible', async ({ page }) => {
    test.setTimeout(180000);

    console.log('🔍 Starting Delete Module test...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-delete-module', 0.15, getFailureTypesForPhase('setup'));

    // Step 2: Navigate to test cases page
    const testCasesUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-cases';
    await page.goto(testCasesUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    console.log('✅ Navigated to test cases page');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout
    await maybeFailAt(page, 'after-navigate-delete-module', 0.15, getFailureTypesForPhase('navigation'));

    // Step 3: Create a module first
    const moduleName = await page.evaluate(() => {
      const now = new Date();
      return `DeleteModule-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    });
    console.log(`📝 Generated module name: ${moduleName}`);

    const modulesTree = page.getByRole('tree', { name: 'modules-tree' });
    await expect(modulesTree).toBeVisible({ timeout: 90000 });

    const allTestCasesItem = page.getByRole('treeitem', { name: /All Test Cases/i });
    await expect(allTestCasesItem).toBeVisible({ timeout: 90000 });
    await allTestCasesItem.click({ button: 'right' });

    await page.waitForTimeout(1000);

    // 💥 FAILURE INJECTION POINT 3: Element not found for context menu
    await maybeFailAt(page, 'before-click-new-module-for-delete', 0.2, ['element-not-found', 'element-not-visible']);

    const newModuleOption = page.getByText(/New Module|Add Module/i).first();
    await expect(newModuleOption).toBeVisible({ timeout: 90000 });
    await newModuleOption.click();

    await page.waitForTimeout(1000);

    const moduleNameInput = page.getByRole('textbox', { name: /module name|Enter name/i }).first();
    await expect(moduleNameInput).toBeVisible({ timeout: 90000 });
    await moduleNameInput.fill(moduleName);
    await moduleNameInput.press('Enter');
    console.log('✅ Created module for deletion');

    await page.waitForTimeout(5000);

    // Verify module was created
    const newModule = page.getByText(moduleName);
    await expect(newModule).toBeVisible({ timeout: 90000 });
    console.log('✅ Module is visible in the tree');

    // 💥 FAILURE INJECTION POINT 4: Stale element after creation
    await maybeFailAt(page, 'after-module-creation-before-delete', 0.2, ['stale-element', 'element-not-interactable']);

    // Step 4: Right-click on the module to delete it
    await newModule.click({ button: 'right' });
    await page.waitForTimeout(1000);
    console.log('✅ Right-clicked on module');

    // 💥 FAILURE INJECTION POINT 5: Element not interactable for delete menu
    await maybeFailAt(page, 'before-click-delete-menu', 0.15, ['element-not-interactable', 'element-not-found']);

    // Step 5: Click "Delete Module" from context menu
    const deleteOption = page.getByText(/Delete Module|Delete/i).first();
    await expect(deleteOption).toBeVisible({ timeout: 90000 });
    await deleteOption.click();
    console.log('✅ Clicked Delete option');

    await page.waitForTimeout(1000);

    // Step 6: Confirm deletion
    // 💥 FAILURE INJECTION POINT 6: JavaScript exception before confirm
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating JavaScript exception...');
      await page.evaluate(() => {
        throw new ReferenceError("confirmDialog is not defined");
      });
    }

    const confirmButton = page.getByRole('button', { name: /Confirm|Delete|Yes/i }).first();
    await expect(confirmButton).toBeVisible({ timeout: 90000 });
    await confirmButton.click();
    console.log('✅ Confirmed deletion');

    await page.waitForTimeout(5000);

    // 💥 FAILURE INJECTION POINT 7: API failure after delete
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating API failure on delete confirmation...');
      throw new Error('API Error: 500 Internal Server Error - DELETE /api/module/delete failed with: {"error":"Foreign key constraint violation","details":"Module has associated test cases"}');
    }

    // Step 7: Verify module is no longer visible
    // 💥 FAILURE INJECTION POINT 8: Assertion failure during verification
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting deleted module is still visible (wrong assertion)...');
      await expect(page.getByText(moduleName)).toBeVisible({ timeout: 3000 });
    }

    const deletedModule = page.getByText(moduleName);
    const isStillVisible = await deletedModule.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isStillVisible).toBeFalsy();
    console.log('✅ Module is no longer visible after deletion');

    // 💥 FAILURE INJECTION POINT 9: Timeout during final verification
    await maybeFailAt(page, 'final-verification-delete-module', 0.15, getFailureTypesForPhase('verification'));

    console.log('✅ Delete Module test completed successfully');
  });
});
