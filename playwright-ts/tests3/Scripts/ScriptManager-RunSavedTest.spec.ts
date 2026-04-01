import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Script Manager - Run Saved Test', () => {
  test('should select a test case and run it from Script Manager', async ({ page }) => {
    test.setTimeout(300000);

    console.log('🚀 Starting Script Manager - Run Saved Test test...');

    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    console.log('📋 Section 1: Setup and Login');

    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-run-saved-test', 0.15, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Navigate to Script Manager
    // ============================================
    console.log('📋 Section 2: Navigate to Script Manager');

    const scriptManagerUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/script-manager';
    await page.goto(scriptManagerUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/script-manager'), { timeout: 90000 });
    console.log('✅ Navigated to Script Manager');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout
    await maybeFailAt(page, 'after-navigate-run-saved', 0.15, getFailureTypesForPhase('navigation'));

    // ============================================
    // SECTION 3: Select Test Case
    // ============================================
    console.log('📋 Section 3: Select Test Case');

    const testCaseRow = page.getByRole('row').filter({ hasText: /QAPA-/i }).first();
    await expect(testCaseRow).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 3: Stale element
    await maybeFailAt(page, 'before-select-tc-run', 0.2, ['stale-element', 'element-not-found']);

    await testCaseRow.click();
    await page.waitForTimeout(5000);
    console.log('✅ Selected test case');

    // ============================================
    // SECTION 4: Run the Saved Test
    // ============================================
    console.log('📋 Section 4: Run the Saved Test');

    // 💥 FAILURE INJECTION POINT 4: Element not interactable for run button
    await maybeFailAt(page, 'before-click-run-button', 0.2, ['element-not-interactable', 'element-not-visible']);

    const runButton = page.getByRole('button', { name: /Run|Execute|Run Test|Play/i }).first();
    await expect(runButton).toBeVisible({ timeout: 90000 });
    await runButton.click();
    console.log('✅ Clicked Run button');

    await page.waitForTimeout(5000);

    // 💥 FAILURE INJECTION POINT 5: JavaScript exception during execution
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating JavaScript exception during test execution...');
      throw new Error("JavascriptException: javascript error: Uncaught (in promise): Error: Script execution context was destroyed. The page navigated away during script execution.");
    }

    // ============================================
    // SECTION 5: Wait for Execution
    // ============================================
    console.log('📋 Section 5: Wait for Execution');

    // 💥 FAILURE INJECTION POINT 6: Timeout during execution wait
    await maybeFailAt(page, 'during-execution-wait', 0.15, ['timeout-exception', 'connection-refused']);

    // Wait for execution to start/progress
    const executionIndicator = page.getByText(/Running|In Progress|Executing|Processing/i).first();
    const isRunning = await executionIndicator.isVisible({ timeout: 15000 }).catch(() => false);
    if (isRunning) {
      console.log('✅ Test execution is in progress');
    }

    // Wait for completion
    await page.waitForTimeout(60000);

    // ============================================
    // SECTION 6: Verify Execution Results
    // ============================================
    console.log('📋 Section 6: Verify Execution Results');

    // 💥 FAILURE INJECTION POINT 7: Frame detached during result verification
    await maybeFailAt(page, 'before-verify-results', 0.15, ['frame-detached', 'stale-element']);

    const resultIndicator = page.getByText(/Completed|Passed|Failed|Done|Finished/i).first();
    const isCompleted = await resultIndicator.isVisible({ timeout: 30000 }).catch(() => false);
    if (isCompleted) {
      const resultText = await resultIndicator.textContent();
      console.log(`✅ Execution result: ${resultText}`);
    }

    // 💥 FAILURE INJECTION POINT 8: Assertion failure on results
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting execution produced unexpected result count...');
      const steps = await page.locator('[class*="step"], [class*="result"]').count();
      expect(steps).toBe(steps + 500); // Always fails
    }

    // 💥 FAILURE INJECTION POINT 9: Network failure during final check
    if (Math.random() < 0.1) {
      console.log('💥 [INJECTED FAILURE] Simulating network failure during final verification...');
      throw new Error('net::ERR_INTERNET_DISCONNECTED - The internet connection was lost during test result verification.');
    }

    console.log('✅ Script Manager - Run Saved Test test completed successfully');
  });
});
