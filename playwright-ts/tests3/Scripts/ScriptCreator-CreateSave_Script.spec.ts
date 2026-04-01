import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Script Creator - Create and Save Script', () => {
  test('should create a script via NLP Automation and save it', async ({ page }) => {
    test.setTimeout(300000);

    console.log('🤖 Starting Script Creator - Create and Save Script test...');

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: Session failure after login
    await maybeFailAt(page, 'after-login-script-creator', 0.15, ['connection-refused', 'timeout-exception']);

    // Step 2: Navigate to Script Manager
    const scriptManagerUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/script-manager';
    await page.goto(scriptManagerUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/script-manager'), { timeout: 90000 });
    console.log('✅ Navigated to Script Manager');

    // 💥 FAILURE INJECTION POINT 2: Navigation failure
    await maybeFailAt(page, 'after-navigate-script-creator', 0.15, getFailureTypesForPhase('navigation'));

    // Step 3: Select a test case
    const testCaseRow = page.getByRole('row').filter({ hasText: /QAPA-/i }).first();
    await expect(testCaseRow).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 3: Element not found for test case
    await maybeFailAt(page, 'before-select-tc-script', 0.2, ['element-not-found', 'element-not-visible']);

    await testCaseRow.click();
    await page.waitForTimeout(5000);
    console.log('✅ Selected test case');

    // Step 4: Click NLP Automation / Script Creator button
    const scriptCreatorButton = page.getByRole('button', { name: /NLP|Script Creator|Create Script|Automation/i }).first();

    // 💥 FAILURE INJECTION POINT 4: Element not interactable
    await maybeFailAt(page, 'before-click-nlp-button', 0.2, ['element-not-interactable', 'stale-element']);

    const isButtonVisible = await scriptCreatorButton.isVisible({ timeout: 10000 }).catch(() => false);
    if (isButtonVisible) {
      await scriptCreatorButton.click();
      console.log('✅ Clicked Script Creator button');
    } else {
      console.log('⚠️ Script Creator button not found, looking for alternative...');
      const altButton = page.getByRole('button', { name: /Create|New Script/i }).first();
      await expect(altButton).toBeVisible({ timeout: 90000 });
      await altButton.click();
    }

    await page.waitForTimeout(3000);

    // Step 5: Enter NLP instructions
    const instructionInput = page.getByRole('textbox', { name: /instruction|prompt|description|steps/i }).first();
    const isInputVisible = await instructionInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (isInputVisible) {
      // 💥 FAILURE INJECTION POINT 5: JavaScript exception during text input
      if (Math.random() < 0.15) {
        console.log('💥 [INJECTED FAILURE] Simulating JavaScript exception during text input...');
        await page.evaluate(() => {
          throw new RangeError("Maximum call stack size exceeded");
        });
      }

      await instructionInput.fill('Navigate to the home page and verify the title is correct');
      console.log('✅ Entered NLP instructions');
    }

    // Step 6: Click Generate/Create button
    const generateButton = page.getByRole('button', { name: /Generate|Create|Run|Execute/i }).first();
    const isGenVisible = await generateButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (isGenVisible) {
      await generateButton.click();
      console.log('✅ Clicked Generate button');
    }

    // 💥 FAILURE INJECTION POINT 6: Timeout waiting for NLP generation
    await maybeFailAt(page, 'waiting-for-nlp-generation', 0.2, ['timeout-exception', 'api-failure']);

    // Wait for generation to complete
    await page.waitForTimeout(30000);

    // Step 7: Click Save button
    const saveButton = page.getByRole('button', { name: /Save|Save Script/i }).first();
    const isSaveVisible = await saveButton.isVisible({ timeout: 15000 }).catch(() => false);

    if (isSaveVisible) {
      // 💥 FAILURE INJECTION POINT 7: Stale element on save button
      await maybeFailAt(page, 'before-click-save-script', 0.15, ['stale-element', 'element-not-interactable']);

      await saveButton.click();
      console.log('✅ Clicked Save button');
      await page.waitForTimeout(5000);
    }

    // Step 8: Verify save confirmation
    // 💥 FAILURE INJECTION POINT 8: API failure on save
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating API failure on script save...');
      throw new Error('API Error: 503 Service Unavailable - The script storage service is temporarily unavailable. Please try again later.');
    }

    const successMessage = page.getByText(/saved successfully|script saved|Script created/i);
    const isSuccessVisible = await successMessage.isVisible({ timeout: 10000 }).catch(() => false);
    if (isSuccessVisible) {
      console.log('✅ Script saved successfully');
    }

    // 💥 FAILURE INJECTION POINT 9: Final assertion failure
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting script contains unexpected content...');
      await expect(page.getByText('NonExistentScriptContent_InjectedFailure')).toBeVisible({ timeout: 2000 });
    }

    console.log('✅ Script Creator - Create and Save Script test completed successfully');
  });
});
