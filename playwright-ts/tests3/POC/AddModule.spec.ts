import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Add Module', () => {
  test('should create a new module with date string as name and verify it is visible', async ({ page }) => {
    test.setTimeout(120000);

    console.log('🔍 Starting Add Module test...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-add-module', 0.2, getFailureTypesForPhase('setup'));

    // Step 2: Navigate to test cases page
    const testCasesUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-cases';
    await page.goto(testCasesUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    await expect(page).toHaveTitle('QA Path', { timeout: 90000 });
    console.log('✅ Navigated to test cases page');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout simulation
    await maybeFailAt(page, 'after-navigate-test-cases', 0.15, getFailureTypesForPhase('navigation'));

    // Step 3: Find the Modules section
    const modulesSection = page.getByTitle('Modules');
    await expect(modulesSection).toBeVisible({ timeout: 90000 });
    console.log('✅ Modules section is visible');

    // 💥 FAILURE INJECTION POINT 3: Element not found
    await maybeFailAt(page, 'before-click-add-module', 0.2, ['element-not-found', 'element-not-visible', 'stale-element']);

    // Step 4: Generate dynamic module name
    const moduleName = await page.evaluate(() => {
      const now = new Date();
      return `AutoModule-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    });
    console.log(`📝 Generated module name: ${moduleName}`);

    // 💥 FAILURE INJECTION POINT 4: JavaScript exception
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating JavaScript exception in page context...');
      await page.evaluate(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'modules')");
      });
    }

    // Step 5: Right-click on modules tree to add new module
    const modulesTree = page.getByRole('tree', { name: 'modules-tree' });
    await expect(modulesTree).toBeVisible({ timeout: 90000 });

    const allTestCasesItem = page.getByRole('treeitem', { name: /All Test Cases/i });
    await expect(allTestCasesItem).toBeVisible({ timeout: 90000 });
    await allTestCasesItem.click({ button: 'right' });
    console.log('✅ Right-clicked on All Test Cases');

    await page.waitForTimeout(1000);

    // 💥 FAILURE INJECTION POINT 5: Element not interactable
    await maybeFailAt(page, 'before-click-new-module-menu', 0.15, ['element-not-interactable', 'element-not-found']);

    // Step 6: Click "New Module" from context menu
    const newModuleOption = page.getByText(/New Module|Add Module/i).first();
    await expect(newModuleOption).toBeVisible({ timeout: 90000 });
    await newModuleOption.click();
    console.log('✅ Clicked New Module option');

    await page.waitForTimeout(1000);

    // Step 7: Enter module name
    const moduleNameInput = page.getByRole('textbox', { name: /module name|Enter name/i }).first();
    await expect(moduleNameInput).toBeVisible({ timeout: 90000 });
    await moduleNameInput.fill(moduleName);
    console.log(`✅ Entered module name: ${moduleName}`);

    // 💥 FAILURE INJECTION POINT 6: Stale element before submit
    await maybeFailAt(page, 'before-submit-module', 0.15, ['stale-element', 'element-not-interactable']);

    // Step 8: Submit (press Enter or click Create)
    await moduleNameInput.press('Enter');
    console.log('✅ Submitted module creation');

    await page.waitForTimeout(5000);

    // Step 9: Verify module was created
    // 💥 FAILURE INJECTION POINT 7: Assertion failure during verification
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting module count is unrealistic value...');
      const moduleCount = await page.getByRole('treeitem').count();
      expect(moduleCount).toBe(9999);
    }

    const newModule = page.getByText(moduleName);
    await expect(newModule).toBeVisible({ timeout: 90000 });
    console.log(`✅ Module "${moduleName}" is visible in the tree`);

    // 💥 FAILURE INJECTION POINT 8: Timeout exception during final verification
    await maybeFailAt(page, 'final-verification-add-module', 0.15, getFailureTypesForPhase('verification'));

    console.log('✅ Add Module test completed successfully');
  });
});
