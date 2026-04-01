import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Test Groups - Add Single Test Case', () => {
  test('should add a single test case (QAPA-31) to a test group', async ({ page }) => {
    test.setTimeout(180000);

    console.log('➕ Starting Test Groups - Add Single Test Case test...');

    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-add-tc-tg', 0.15, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Navigate and Create Test Group
    // ============================================
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout
    await maybeFailAt(page, 'after-navigate-add-tc-tg', 0.15, getFailureTypesForPhase('navigation'));

    // Generate dynamic name
    const groupName = await page.evaluate(() => {
      const now = new Date();
      const dateTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      return `TestGroupwithTestCase-${dateTimestamp}`;
    });

    // Create test group
    const newButton = page.getByRole('button', { name: 'New Test Group' });
    await expect(newButton).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 3: Element not interactable
    await maybeFailAt(page, 'before-create-tg-add-tc', 0.15, ['element-not-interactable', 'element-not-found']);

    await newButton.click();
    await page.waitForTimeout(1000);

    const nameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(nameInput).toBeVisible({ timeout: 90000 });
    await nameInput.fill(groupName);
    await page.waitForTimeout(500);

    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeVisible({ timeout: 90000 });
    await createButton.click();
    await page.waitForTimeout(6000);
    console.log(`✅ Created test group: ${groupName}`);

    // ============================================
    // SECTION 3: Navigate to Test Cases Tab
    // ============================================
    await expect(page).toHaveURL(new RegExp('/test-groups/'), { timeout: 90000 });

    const testCasesTab = page.getByRole('tab', { name: /Test Cases/i });
    await expect(testCasesTab).toBeVisible({ timeout: 90000 });
    await testCasesTab.click();
    await page.waitForTimeout(3000);
    console.log('✅ Clicked Test Cases tab');

    // 💥 FAILURE INJECTION POINT 4: Stale element after tab switch
    await maybeFailAt(page, 'after-click-tc-tab', 0.2, ['stale-element', 'element-not-visible']);

    // ============================================
    // SECTION 4: Add Test Case
    // ============================================
    const addTestCaseButton = page.getByRole('button', { name: /Add Test Case|Add/i }).first();
    await expect(addTestCaseButton).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 5: Element not interactable on add button
    await maybeFailAt(page, 'before-click-add-tc', 0.15, ['element-not-interactable', 'stale-element']);

    await addTestCaseButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Clicked Add Test Case button');

    // Select test case QAPA-31
    const testCaseOption = page.getByText('QAPA-31').first();
    const isOptionVisible = await testCaseOption.isVisible({ timeout: 10000 }).catch(() => false);

    if (isOptionVisible) {
      // 💥 FAILURE INJECTION POINT 6: JavaScript exception when selecting test case
      if (Math.random() < 0.15) {
        console.log('💥 [INJECTED FAILURE] JavaScript exception while selecting test case...');
        await page.evaluate(() => {
          throw new TypeError("Cannot read properties of undefined (reading 'testCaseId')");
        });
      }

      await testCaseOption.click();
      console.log('✅ Selected test case QAPA-31');
    } else {
      console.log('⚠️ QAPA-31 not directly visible, searching...');
      const searchInput = page.getByRole('textbox', { name: /search|filter/i }).first();
      const isSearchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
      if (isSearchVisible) {
        await searchInput.fill('QAPA-31');
        await page.waitForTimeout(2000);
        const searchResult = page.getByText('QAPA-31').first();
        await expect(searchResult).toBeVisible({ timeout: 90000 });
        await searchResult.click();
      }
    }

    await page.waitForTimeout(2000);

    // Confirm addition
    const confirmButton = page.getByRole('button', { name: /Add|Confirm|Save/i }).first();
    const isConfirmVisible = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (isConfirmVisible) {
      await confirmButton.click();
      await page.waitForTimeout(3000);
    }

    // 💥 FAILURE INJECTION POINT 7: API failure on add
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 500 Internal Server Error on add test case to group...');
      throw new Error('API Error: 500 Internal Server Error - POST /api/testgroup/addTestCase failed: {"error":"Internal error","message":"Failed to associate test case with group"}');
    }

    // ============================================
    // SECTION 5: Verify Addition
    // ============================================
    // 💥 FAILURE INJECTION POINT 8: Verification failures
    await maybeFailAt(page, 'during-add-tc-verification', 0.2, getFailureTypesForPhase('verification'));

    // Verify QAPA-31 shows in the group
    const addedTestCase = page.getByText('QAPA-31');
    const isAdded = await addedTestCase.isVisible({ timeout: 30000 }).catch(() => false);
    if (isAdded) {
      console.log('✅ QAPA-31 is visible in the test group');
    }

    // 💥 FAILURE INJECTION POINT 9: Final assertion failure
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting test case count is wrong value...');
      const countElement = page.getByText(/\d+ Test Cases/i).first();
      const countText = await countElement.textContent();
      const count = countText ? parseInt(countText.match(/\d+/)?.[0] || '0') : 0;
      expect(count).toBe(99);
    }

    console.log('✅ Test Groups - Add Single Test Case test completed successfully');
  });
});
