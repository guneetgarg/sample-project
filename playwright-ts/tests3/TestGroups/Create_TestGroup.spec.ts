import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Create Test Group', () => {
  test('should create a new test group with dynamic name containing date timestamp', async ({ page }) => {
    test.setTimeout(120000);

    console.log('🔧 Starting Create Test Group test...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-create-tg', 0.15, getFailureTypesForPhase('setup'));

    // Step 2: Navigate to Test Groups page
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    await expect(page).toHaveTitle('QA Path', { timeout: 90000 });
    await expect(page.getByText(/Test Groups|Test Groups Library/i).first()).toBeVisible({ timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout
    await maybeFailAt(page, 'after-navigate-create-tg', 0.15, getFailureTypesForPhase('navigation'));

    // Step 3: Get initial total count
    const initialTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const initialTotal = initialTotalText ? parseInt(initialTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Initial total test groups: ${initialTotal}`);

    // Step 4: Generate dynamic name
    const dynamicName = await page.evaluate(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const dateTimestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      return `TestGroupCreatedbyAutomation-${dateTimestamp}`;
    });
    console.log(`📝 Generated dynamic test group name: ${dynamicName}`);

    // Step 5: Click "New Test Group" button
    const newTestGroupButton = page.getByRole('button', { name: 'New Test Group' });
    await expect(newTestGroupButton).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 3: Element not interactable on button
    await maybeFailAt(page, 'before-click-new-tg', 0.2, ['element-not-interactable', 'element-not-found', 'stale-element']);

    await newTestGroupButton.click();
    console.log('✅ Clicked New Test Group button');

    await page.waitForTimeout(1000);

    // Verify modal
    await expect(page.getByRole('heading', { name: 'Create New Test Group' })).toBeVisible({ timeout: 90000 });
    console.log('✅ Create New Test Group modal is visible');

    // Step 6: Enter name
    const groupNameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(groupNameInput).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 4: JavaScript exception during fill
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] JavaScript exception while filling group name...');
      await page.evaluate(() => {
        throw new TypeError("Cannot set properties of null (setting 'value')");
      });
    }

    await groupNameInput.fill(dynamicName);
    console.log(`✅ Entered dynamic name: ${dynamicName}`);
    await page.waitForTimeout(500);

    // Step 7: Click Create button
    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeVisible({ timeout: 90000 });
    await expect(createButton).toBeEnabled({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 5: Stale element on create button
    await maybeFailAt(page, 'before-click-create-tg', 0.15, ['stale-element', 'element-not-interactable']);

    await createButton.click();
    console.log('✅ Clicked Create button');

    await page.waitForTimeout(6000);

    // 💥 FAILURE INJECTION POINT 6: API failure on create
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 409 Conflict on test group creation...');
      throw new Error('API Error: 409 Conflict - POST /api/testgroup/create failed: {"error":"Duplicate name","message":"A test group with this name already exists"}');
    }

    // Step 8: Verify creation
    const successAlert = page.getByText(/Test group created successfully|created successfully/i).first();
    const isSuccessVisible = await successAlert.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSuccessVisible) {
      console.log('✅ Success message is visible');
    }

    // Navigate back to list
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 7: Verification failures
    await maybeFailAt(page, 'during-tg-creation-verification', 0.2, getFailureTypesForPhase('verification'));

    // Get updated total count
    const updatedTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const updatedTotal = updatedTotalText ? parseInt(updatedTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Updated total test groups: ${updatedTotal}`);

    expect(updatedTotal).toBeGreaterThan(initialTotal);
    console.log('✅ Test group count increased');

    // Verify group is visible
    const newGroupName = page.getByText(dynamicName);
    await expect(newGroupName).toBeVisible({ timeout: 90000 });
    console.log(`✅ New test group "${dynamicName}" is visible`);

    // Verify it's a Static group
    const newGroupRow = page.getByRole('row').filter({ has: newGroupName });
    await expect(newGroupRow).toBeVisible({ timeout: 90000 });
    const staticType = newGroupRow.getByText('Static');
    await expect(staticType).toBeVisible({ timeout: 90000 });
    console.log('✅ Test group type is Static');

    // 💥 FAILURE INJECTION POINT 8: Final assertion failure
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting row contains unexpected value...');
      const rowText = await newGroupRow.textContent();
      expect(rowText).toContain('NonExistentValue_InjectedFailure');
    }

    const rowText = await newGroupRow.textContent();
    expect(rowText).toContain('0');
    console.log('✅ Test group has 0 test cases (as expected)');

    console.log('✅ Create Test Group test completed successfully');
  });
});
