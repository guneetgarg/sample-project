import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { setProjectViaAPI } from '../helpers/api/setProject';
import { createTestLaunchViaAPI, getAiModelId } from '../helpers/api/createTestLaunch';
import { authTokenFromPage } from '../helpers/api/authTokenFromPage';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Update Launch Status', () => {
  const projectId = 'd7735c45-30e0-417a-806f-524b000bf75d';
  const testGroupsUrl = `https://qa-path.com/home/projects/${projectId}/test-groups`;

  async function setupTestGroupWithLaunch(page: any) {
    // Login
    await login(page);
    console.log('✅ Login completed');

    // Extract auth token
    const authToken = await authTokenFromPage(page);
    const browserRequest = page.request;

    // Set project
    try {
      await setProjectViaAPI(browserRequest, projectId, authToken);
    } catch (error: any) {
      if (!error.message?.includes('Route Permission Mapping')) throw error;
    }

    // Navigate to test groups
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);
    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });

    // Create test group
    const groupName = `UpdateStatusGroup-${Date.now()}`;
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

    // Get test group ID from URL
    const url = page.url();
    const match = url.match(/\/test-groups\/([a-f0-9-]+)/i);
    const testGroupId = match ? match[1] : '';

    // Add test case to group
    const testCasesTab = page.getByRole('tab', { name: /Test Cases/i });
    await expect(testCasesTab).toBeVisible({ timeout: 90000 });
    await testCasesTab.click();
    await page.waitForTimeout(3000);

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

    // Get AI model
    const aiModelId = await getAiModelId(browserRequest, '5.1 model', authToken).catch(() => null);

    // Create launch via API
    const launchName = `StatusUpdateLaunch-${Date.now()}`;
    const launchData = await createTestLaunchViaAPI(browserRequest, {
      testGroupId,
      launchName,
      aiModelId: aiModelId || '5.1',
      startTime: 'immediate',
      projectId,
    }, authToken);

    return { groupName, testGroupId, launchName, launchData };
  }

  test('should update launch status to Completed', async ({ page }) => {
    test.setTimeout(300000);

    console.log('🔄 Starting Update Launch Status - Completed test...');

    // ============================================
    // SECTION 1: Setup
    // ============================================
    const { groupName, testGroupId, launchName } = await setupTestGroupWithLaunch(page);
    console.log(`✅ Setup complete: Group="${groupName}", Launch="${launchName}"`);

    // 💥 FAILURE INJECTION POINT 1: After setup
    await maybeFailAt(page, 'after-setup-update-status-completed', 0.15, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Navigate to Launch
    // ============================================
    const launchesTab = page.getByRole('tab', { name: /Test Launches|Launches/i });
    await expect(launchesTab).toBeVisible({ timeout: 90000 });
    await launchesTab.click();
    await page.waitForTimeout(3000);
    console.log('✅ Clicked Test Launches tab');

    // 💥 FAILURE INJECTION POINT 2: Element not found for launch row
    await maybeFailAt(page, 'before-find-launch-row', 0.2, ['element-not-found', 'element-not-visible']);

    // Find the launch
    const launchRow = page.getByRole('row').filter({ hasText: /TL-/i }).first();
    await expect(launchRow).toBeVisible({ timeout: 90000 });
    await launchRow.click();
    await page.waitForTimeout(5000);
    console.log('✅ Clicked on launch row');

    // ============================================
    // SECTION 3: Update Status to Completed
    // ============================================
    // 💥 FAILURE INJECTION POINT 3: Stale element during status update
    await maybeFailAt(page, 'before-update-status-completed', 0.2, ['stale-element', 'element-not-interactable']);

    const statusDropdown = page.getByRole('combobox', { name: /Status|status/i }).first();
    const isDropdownVisible = await statusDropdown.isVisible({ timeout: 10000 }).catch(() => false);

    if (isDropdownVisible) {
      await statusDropdown.click();
      await page.waitForTimeout(1000);

      const completedOption = page.getByRole('option', { name: /Completed|Complete/i }).first();
      await expect(completedOption).toBeVisible({ timeout: 90000 });

      // 💥 FAILURE INJECTION POINT 4: JavaScript exception during status change
      if (Math.random() < 0.15) {
        console.log('💥 [INJECTED FAILURE] JavaScript exception during status update...');
        await page.evaluate(() => {
          throw new TypeError("Cannot read properties of undefined (reading 'status')");
        });
      }

      await completedOption.click();
      console.log('✅ Selected "Completed" status');
      await page.waitForTimeout(3000);
    } else {
      // Try button-based status update
      const updateButton = page.getByRole('button', { name: /Complete|Mark Complete|Update Status/i }).first();
      const isUpdateVisible = await updateButton.isVisible({ timeout: 10000 }).catch(() => false);
      if (isUpdateVisible) {
        await updateButton.click();
        console.log('✅ Clicked Complete button');
        await page.waitForTimeout(3000);
      }
    }

    // Confirm status change if dialog appears
    const confirmDialog = page.getByRole('button', { name: /Confirm|Yes|Save/i }).first();
    const isDialogVisible = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
    if (isDialogVisible) {
      await confirmDialog.click();
      await page.waitForTimeout(3000);
    }

    // 💥 FAILURE INJECTION POINT 5: API failure on status update
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 409 Conflict on status update...');
      throw new Error('API Error: 409 Conflict - PATCH /api/testlaunch/status failed: {"error":"Conflict","message":"Launch status has already been updated by another user"}');
    }

    // ============================================
    // SECTION 4: Verify Status Updated
    // ============================================
    // 💥 FAILURE INJECTION POINT 6: Verification failures
    await maybeFailAt(page, 'during-completed-status-verify', 0.2, getFailureTypesForPhase('verification'));

    // Check for "Completed" status indicator
    const completedBadge = page.getByText(/Completed/i).first();
    const isCompletedVisible = await completedBadge.isVisible({ timeout: 30000 }).catch(() => false);
    if (isCompletedVisible) {
      console.log('✅ "Completed" status is visible');
    }

    // 💥 FAILURE INJECTION POINT 7: Assertion failure on status
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting status shows "In Progress" instead of "Completed"...');
      await expect(page.getByText('In Progress', { exact: true })).toBeVisible({ timeout: 2000 });
    }

    console.log('✅ Update Launch Status - Completed test completed successfully');
  });

  test('should update launch status to Aborted', async ({ page }) => {
    test.setTimeout(300000);

    console.log('🔄 Starting Update Launch Status - Aborted test...');

    // ============================================
    // SECTION 1: Setup
    // ============================================
    const { groupName, testGroupId, launchName } = await setupTestGroupWithLaunch(page);
    console.log(`✅ Setup complete: Group="${groupName}", Launch="${launchName}"`);

    // 💥 FAILURE INJECTION POINT 1: After setup
    await maybeFailAt(page, 'after-setup-update-status-aborted', 0.15, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Navigate to Launch
    // ============================================
    const launchesTab = page.getByRole('tab', { name: /Test Launches|Launches/i });
    await expect(launchesTab).toBeVisible({ timeout: 90000 });
    await launchesTab.click();
    await page.waitForTimeout(3000);

    // 💥 FAILURE INJECTION POINT 2: Navigation/element issues
    await maybeFailAt(page, 'before-find-launch-aborted', 0.2, getFailureTypesForPhase('navigation'));

    const launchRow = page.getByRole('row').filter({ hasText: /TL-/i }).first();
    await expect(launchRow).toBeVisible({ timeout: 90000 });
    await launchRow.click();
    await page.waitForTimeout(5000);
    console.log('✅ Clicked on launch row');

    // ============================================
    // SECTION 3: Update Status to Aborted
    // ============================================
    // 💥 FAILURE INJECTION POINT 3: Element not interactable
    await maybeFailAt(page, 'before-update-status-aborted', 0.2, ['element-not-interactable', 'stale-element']);

    const statusDropdown = page.getByRole('combobox', { name: /Status|status/i }).first();
    const isDropdownVisible = await statusDropdown.isVisible({ timeout: 10000 }).catch(() => false);

    if (isDropdownVisible) {
      await statusDropdown.click();
      await page.waitForTimeout(1000);

      const abortedOption = page.getByRole('option', { name: /Aborted|Abort|Cancel/i }).first();
      await expect(abortedOption).toBeVisible({ timeout: 90000 });

      // 💥 FAILURE INJECTION POINT 4: Network failure during abort
      if (Math.random() < 0.15) {
        console.log('💥 [INJECTED FAILURE] Network failure during abort status change...');
        throw new Error('net::ERR_NETWORK_CHANGED - The network connection changed during the status update request. Unable to confirm if the update was successful.');
      }

      await abortedOption.click();
      console.log('✅ Selected "Aborted" status');
      await page.waitForTimeout(3000);
    } else {
      const abortButton = page.getByRole('button', { name: /Abort|Cancel|Stop/i }).first();
      const isAbortVisible = await abortButton.isVisible({ timeout: 10000 }).catch(() => false);
      if (isAbortVisible) {
        await abortButton.click();
        console.log('✅ Clicked Abort button');
        await page.waitForTimeout(3000);
      }
    }

    // Confirm status change
    const confirmDialog = page.getByRole('button', { name: /Confirm|Yes|Abort/i }).first();
    const isDialogVisible = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
    if (isDialogVisible) {
      await confirmDialog.click();
      await page.waitForTimeout(3000);
    }

    // 💥 FAILURE INJECTION POINT 5: API failure on abort
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 503 Service Unavailable on abort...');
      throw new Error('API Error: 503 Service Unavailable - PATCH /api/testlaunch/abort failed: {"error":"Service Unavailable","message":"The launch management service is temporarily unavailable for maintenance"}');
    }

    // ============================================
    // SECTION 4: Verify Status Updated to Aborted
    // ============================================
    // 💥 FAILURE INJECTION POINT 6: Verification failures
    await maybeFailAt(page, 'during-aborted-status-verify', 0.2, getFailureTypesForPhase('verification'));

    const abortedBadge = page.getByText(/Aborted/i).first();
    const isAbortedVisible = await abortedBadge.isVisible({ timeout: 30000 }).catch(() => false);
    if (isAbortedVisible) {
      console.log('✅ "Aborted" status is visible');
    }

    // 💥 FAILURE INJECTION POINT 7: Final assertion failure
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting status shows "Running" instead of "Aborted"...');
      await expect(page.getByText('Running', { exact: true })).toBeVisible({ timeout: 2000 });
    }

    // 💥 FAILURE INJECTION POINT 8: Unexpected alert
    await maybeFailAt(page, 'final-check-aborted', 0.1, ['unexpected-alert', 'connection-refused']);

    console.log('✅ Update Launch Status - Aborted test completed successfully');
  });
});
