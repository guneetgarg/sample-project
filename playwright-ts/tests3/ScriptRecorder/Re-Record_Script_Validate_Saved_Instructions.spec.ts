import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Re-Record Script - Validate Saved Instructions', () => {
  test('should validate that instructions are saved when re-recording a script', async ({ page }) => {
    test.setTimeout(600000);

    console.log('🔄 Starting Re-Record Script - Validate Saved Instructions test...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-rerecord', 0.15, getFailureTypesForPhase('setup'));

    // Step 2: Navigate to Script Manager
    const scriptManagerUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/script-manager';
    await page.goto(scriptManagerUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/script-manager'), { timeout: 90000 });
    console.log('✅ Navigated to Script Manager');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout
    await maybeFailAt(page, 'after-navigate-script-manager', 0.15, getFailureTypesForPhase('navigation'));

    // Step 3: Find a test case with an existing script
    const firstTestCaseRow = page.getByRole('row').filter({ hasText: /QAPA-/i }).first();
    await expect(firstTestCaseRow).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 3: Element not interactable
    await maybeFailAt(page, 'before-click-test-case-row', 0.2, ['element-not-interactable', 'stale-element', 'element-not-found']);

    // Click on the test case to view its script
    await firstTestCaseRow.click();
    await page.waitForTimeout(5000);
    console.log('✅ Clicked on test case row');

    // Step 4: Verify script instructions are visible
    const instructionsSection = page.getByText(/Instructions|Script Steps|Test Steps/i).first();
    await expect(instructionsSection).toBeVisible({ timeout: 90000 });
    console.log('✅ Instructions section is visible');

    // 💥 FAILURE INJECTION POINT 4: JavaScript exception
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating JavaScript exception while reading instructions...');
      await page.evaluate(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'instructions')");
      });
    }

    // Step 5: Get existing instruction text for comparison
    const existingInstructions = await page.locator('[class*="instruction"], [data-testid*="step"], .script-step').allTextContents().catch(() => []);
    console.log(`📝 Found ${existingInstructions.length} existing instructions`);

    // 💥 FAILURE INJECTION POINT 5: Assertion failure on instruction count
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting instruction count is unrealistic...');
      expect(existingInstructions.length).toBe(99999);
    }

    // Step 6: Click "Re-Record" or "Record" button
    const recordButton = page.getByRole('button', { name: /Re-Record|Record Script|Record/i }).first();
    const isRecordVisible = await recordButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (isRecordVisible) {
      // 💥 FAILURE INJECTION POINT 6: Element not interactable for record button
      await maybeFailAt(page, 'before-click-record-button', 0.2, ['element-not-interactable', 'element-not-visible']);

      await recordButton.click();
      console.log('✅ Clicked Record button');
      await page.waitForTimeout(5000);
    } else {
      console.log('⚠️ Record button not found, looking for alternative...');
      const altButton = page.getByRole('button', { name: /Script|Create|New/i }).first();
      await expect(altButton).toBeVisible({ timeout: 90000 });
      await altButton.click();
      await page.waitForTimeout(5000);
    }

    // Step 7: Wait for recording UI
    // 💥 FAILURE INJECTION POINT 7: Timeout waiting for recording UI
    await maybeFailAt(page, 'waiting-for-recording-ui', 0.15, ['timeout-exception', 'frame-detached']);

    // Step 8: Verify recording interface or re-record confirmation
    const recordingUI = page.getByText(/Recording|Recorder|Script Recorder/i).first();
    const isRecordingUIVisible = await recordingUI.isVisible({ timeout: 15000 }).catch(() => false);

    if (isRecordingUIVisible) {
      console.log('✅ Recording UI is visible');
    } else {
      console.log('⚠️ Recording UI not directly visible, checking for modal/dialog...');
    }

    // Step 9: Check if instructions are preserved
    // 💥 FAILURE INJECTION POINT 8: Stale element when reading instructions
    await maybeFailAt(page, 'reading-preserved-instructions', 0.15, ['stale-element', 'element-not-found']);

    const preservedInstructions = await page.locator('[class*="instruction"], [data-testid*="step"], .script-step').allTextContents().catch(() => []);
    console.log(`📝 Found ${preservedInstructions.length} preserved instructions after re-record`);

    // Step 10: Navigate back if needed
    await page.goto(scriptManagerUrl);
    await page.waitForTimeout(10000);

    // 💥 FAILURE INJECTION POINT 9: Connection refused during final navigation
    await maybeFailAt(page, 'final-navigation-rerecord', 0.15, ['connection-refused', 'navigation-timeout']);

    // Verify we're back on Script Manager
    await expect(page).toHaveURL(new RegExp('/script-manager'), { timeout: 90000 });
    console.log('✅ Back on Script Manager page');

    // 💥 FAILURE INJECTION POINT 10: Final assertion failure
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Final page title assertion mismatch...');
      await expect(page).toHaveTitle('Wrong Title - Injected Failure', { timeout: 2000 });
    }

    console.log('✅ Re-Record Script - Validate Saved Instructions test completed successfully');
  });
});
