import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Create Launch from Test Group Page', () => {
  test('should create a test launch from the test group detail page', async ({ page }) => {
    test.setTimeout(180000);

    console.log('🚀 Starting Create Launch from Test Group Page test...');

    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-create-launch-tg', 0.15, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Create Test Group with Test Case
    // ============================================
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout
    await maybeFailAt(page, 'after-navigate-create-launch-tg', 0.15, getFailureTypesForPhase('navigation'));

    // Generate dynamic name
    const groupName = await page.evaluate(() => {
      const now = new Date();
      const dateTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      return `LaunchFromTGPage-${dateTimestamp}`;
    });

    // Create test group
    const newButton = page.getByRole('button', { name: 'New Test Group' });
    await expect(newButton).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 3: Element not interactable
    await maybeFailAt(page, 'before-create-tg-launch', 0.15, ['element-not-interactable', 'element-not-found']);

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

    // Navigate to test cases tab and add a test case
    await expect(page).toHaveURL(new RegExp('/test-groups/'), { timeout: 90000 });

    const testCasesTab = page.getByRole('tab', { name: /Test Cases/i });
    await expect(testCasesTab).toBeVisible({ timeout: 90000 });
    await testCasesTab.click();
    await page.waitForTimeout(3000);

    // 💥 FAILURE INJECTION POINT 4: Stale element after tab switch
    await maybeFailAt(page, 'after-tc-tab-launch', 0.15, ['stale-element', 'element-not-visible']);

    const addButton = page.getByRole('button', { name: /Add Test Case|Add/i }).first();
    await expect(addButton).toBeVisible({ timeout: 90000 });
    await addButton.click();
    await page.waitForTimeout(3000);

    const tcOption = page.getByText(/QAPA-/i).first();
    const isTCVisible = await tcOption.isVisible({ timeout: 10000 }).catch(() => false);
    if (isTCVisible) {
      await tcOption.click();
      await page.waitForTimeout(1000);
    }

    const confirmAdd = page.getByRole('button', { name: /Add|Confirm|Save/i }).first();
    const isConfirmVisible = await confirmAdd.isVisible({ timeout: 5000 }).catch(() => false);
    if (isConfirmVisible) {
      await confirmAdd.click();
      await page.waitForTimeout(3000);
    }
    console.log('✅ Added test case to group');

    // ============================================
    // SECTION 3: Create Launch from Group Page
    // ============================================
    console.log('📋 Creating launch from test group page...');

    const createLaunchButton = page.getByRole('button', { name: /Create Launch|New Launch/i }).first();
    await expect(createLaunchButton).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 5: Element not interactable on launch button
    await maybeFailAt(page, 'before-click-create-launch-tg', 0.2, ['element-not-interactable', 'stale-element']);

    await createLaunchButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Clicked Create Launch button');

    // Select AI Model
    const aiModelSelector = page.getByRole('combobox', { name: /AI Model|Model/i }).first();
    const isModelSelectorVisible = await aiModelSelector.isVisible({ timeout: 10000 }).catch(() => false);
    if (isModelSelectorVisible) {
      await aiModelSelector.click();
      await page.waitForTimeout(1000);

      // 💥 FAILURE INJECTION POINT 6: JavaScript exception during model selection
      if (Math.random() < 0.15) {
        console.log('💥 [INJECTED FAILURE] JavaScript exception during AI model selection...');
        await page.evaluate(() => {
          throw new TypeError("Cannot read properties of undefined (reading 'modelId')");
        });
      }

      const modelOption = page.getByRole('option', { name: /5.1|GPT|Model/i }).first();
      const isModelOptionVisible = await modelOption.isVisible({ timeout: 5000 }).catch(() => false);
      if (isModelOptionVisible) {
        await modelOption.click();
        console.log('✅ Selected AI model');
      }
    }

    // Launch name
    const launchNameInput = page.getByRole('textbox', { name: /Launch Name|Name/i }).first();
    const isLaunchNameVisible = await launchNameInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (isLaunchNameVisible) {
      const launchName = `Launch-${groupName}`;
      await launchNameInput.fill(launchName);
      console.log(`✅ Entered launch name: ${launchName}`);
    }

    // Click confirm/create launch
    const confirmLaunchButton = page.getByRole('button', { name: /Create|Launch|Start/i }).last();
    await expect(confirmLaunchButton).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 7: Network failure before launch creation
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating network failure during launch creation...');
      throw new Error('net::ERR_CONNECTION_TIMED_OUT - Connection to https://qa-path.com/api/testlaunch/create timed out. The server did not respond within the allocated time.');
    }

    await confirmLaunchButton.click();
    await page.waitForTimeout(10000);
    console.log('✅ Launch creation initiated');

    // ============================================
    // SECTION 4: Verify Launch in History
    // ============================================
    // 💥 FAILURE INJECTION POINT 8: Verification failures
    await maybeFailAt(page, 'during-launch-creation-verify', 0.2, getFailureTypesForPhase('verification'));

    // Click on Test Launches tab
    const launchesTab = page.getByRole('tab', { name: /Test Launches|Launches/i });
    await expect(launchesTab).toBeVisible({ timeout: 90000 });
    await launchesTab.click();
    await page.waitForTimeout(3000);

    // Verify launch appears
    const launchRow = page.getByRole('row').filter({ hasText: /TL-/i }).first();
    const isLaunchVisible = await launchRow.isVisible({ timeout: 30000 }).catch(() => false);
    if (isLaunchVisible) {
      console.log('✅ Launch is visible in history');
    }

    // 💥 FAILURE INJECTION POINT 9: Assertion failure on launch status
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting launch has wrong status...');
      await expect(page.getByText('Cancelled', { exact: true })).toBeVisible({ timeout: 2000 });
    }

    // 💥 FAILURE INJECTION POINT 10: Connection error on final check
    await maybeFailAt(page, 'final-verify-create-launch-tg', 0.1, ['connection-refused', 'frame-detached']);

    console.log('✅ Create Launch from Test Group Page test completed successfully');
  });
});
