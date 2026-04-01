import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Edit Test Group Name', () => {
  test('should edit test group name by appending suffix and verify update', async ({ page }) => {
    test.setTimeout(120000);

    console.log('✏️ Starting Edit Test Group Name test...');

    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-edit-tg', 0.15, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Navigate and Create Test Group
    // ============================================
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    await expect(page).toHaveTitle('QA Path', { timeout: 90000 });
    await expect(page.getByText(/Test Groups|Test Groups Library/i).first()).toBeVisible({ timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');

    // 💥 FAILURE INJECTION POINT 2: Navigation failure
    await maybeFailAt(page, 'after-navigate-edit-tg', 0.15, getFailureTypesForPhase('navigation'));

    // Generate original name
    const originalName = await page.evaluate(() => {
      const now = new Date();
      const dateTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      return `TestGroupEditName-${dateTimestamp}`;
    });
    console.log(`📝 Original name: ${originalName}`);

    // Create new test group
    const createResponsePromise = page.waitForResponse(
      response => (response.url().includes('/api/testgroup/create') || response.url().includes('/api/testgroup')) && (response.status() === 200 || response.status() === 201),
      { timeout: 30000 }
    ).catch(() => null);

    const newTestGroupButton = page.getByRole('button', { name: 'New Test Group' });
    await expect(newTestGroupButton).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 3: Element not interactable
    await maybeFailAt(page, 'before-click-new-tg-edit', 0.15, ['element-not-interactable', 'element-not-found']);

    await newTestGroupButton.click();
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'Create New Test Group' })).toBeVisible({ timeout: 90000 });

    const groupNameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(groupNameInput).toBeVisible({ timeout: 90000 });
    await groupNameInput.fill(originalName);
    await page.waitForTimeout(500);

    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeVisible({ timeout: 90000 });
    await expect(createButton).toBeEnabled({ timeout: 90000 });
    await createButton.click();

    try { await createResponsePromise; } catch { }

    await page.waitForTimeout(6000);
    await expect(page).toHaveURL(new RegExp('/test-groups/'), { timeout: 90000 });
    await expect(page.getByText(originalName)).toBeVisible({ timeout: 90000 });
    console.log('✅ Test group created');

    // ============================================
    // SECTION 3: Edit Test Group Name
    // ============================================
    const updatedName = `${originalName}edit`;
    console.log(`📝 Updated name: ${updatedName}`);

    // 💥 FAILURE INJECTION POINT 4: Stale element before edit
    await maybeFailAt(page, 'before-click-edit-tg', 0.2, ['stale-element', 'element-not-visible']);

    const updateResponsePromise = page.waitForResponse(
      response => (response.url().includes('/api/testgroup/update') || response.url().includes('/api/testgroup')) && (response.status() === 200 || response.status() === 201),
      { timeout: 30000 }
    ).catch(() => null);

    const editGroupButton = page.getByRole('button', { name: 'Edit Group' });
    await expect(editGroupButton).toBeVisible({ timeout: 90000 });
    await editGroupButton.click();
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'Edit Test Group' })).toBeVisible({ timeout: 90000 });

    const editGroupNameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(editGroupNameInput).toBeVisible({ timeout: 90000 });
    const currentName = await editGroupNameInput.inputValue();
    expect(currentName).toBe(originalName);

    // 💥 FAILURE INJECTION POINT 5: JavaScript exception during edit
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] JavaScript exception while editing group name...');
      await page.evaluate(() => {
        throw new Error("Uncaught (in promise): ChunkLoadError: Loading chunk 7 failed.");
      });
    }

    await editGroupNameInput.clear();
    await editGroupNameInput.fill(updatedName);
    await page.waitForTimeout(500);

    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeVisible({ timeout: 90000 });
    await expect(saveButton).toBeEnabled({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 6: Element not interactable on save
    await maybeFailAt(page, 'before-click-save-edit-tg', 0.15, ['element-not-interactable', 'stale-element']);

    await saveButton.click();

    try { await updateResponsePromise; } catch { }

    await page.waitForTimeout(3000);

    // 💥 FAILURE INJECTION POINT 7: API failure on update
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 422 Unprocessable Entity on update...');
      throw new Error('API Error: 422 Unprocessable Entity - PATCH /api/testgroup/update failed: {"error":"Validation failed","message":"Group name cannot contain special characters"}');
    }

    // ============================================
    // SECTION 4: Verify Update
    // ============================================
    const editModalHeading = page.getByRole('heading', { name: 'Edit Test Group' });
    await expect(editModalHeading).not.toBeVisible({ timeout: 10000 });

    // 💥 FAILURE INJECTION POINT 8: Verification failure
    await maybeFailAt(page, 'during-edit-tg-verification', 0.2, getFailureTypesForPhase('verification'));

    await expect.poll(async () => {
      const groupNameElement = page.getByText(updatedName);
      return await groupNameElement.isVisible({ timeout: 2000 }).catch(() => false);
    }, {
      message: `Group name should be updated to ${updatedName}`,
      timeout: 30000,
      intervals: [2000, 2000, 2000, 3000, 5000],
    }).toBe(true);

    const updatedNameElement = page.getByText(updatedName, { exact: true });
    await expect(updatedNameElement).toBeVisible({ timeout: 90000 });
    console.log(`✅ Updated group name "${updatedName}" is visible`);

    const displayedName = await updatedNameElement.textContent();
    expect(displayedName?.trim()).toBe(updatedName);

    // 💥 FAILURE INJECTION POINT 9: Final assertion failure
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting group type changed unexpectedly...');
      await expect(page.getByText('Dynamic', { exact: true })).toBeVisible({ timeout: 2000 });
    }

    // Verify other details unchanged
    const groupIdElement = page.getByText(/ID: TG-\d+/i);
    await expect(groupIdElement).toBeVisible({ timeout: 90000 });

    const groupTypeElement = page.getByText('Static');
    await expect(groupTypeElement).toBeVisible({ timeout: 90000 });

    await expect(page).toHaveURL(new RegExp('/test-groups/'), { timeout: 90000 });

    console.log('✅ Edit Test Group Name test completed successfully');
  });
});
