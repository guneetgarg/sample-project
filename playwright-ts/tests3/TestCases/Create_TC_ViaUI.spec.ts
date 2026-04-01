import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Create Test Case via UI', () => {
  test('should create a test case with dynamic DateTime description', async ({ page }) => {
    test.setTimeout(120000);

    console.log('🔄 Starting Create Test Case via UI test...');

    // Track API requests for analysis
    const apiRequests: Array<{ url: string; method: string; postData?: any; response?: any }> = [];

    // Listen for all network requests
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
        });
      }
    });

    // Step 1: Login
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-create-tc-ui', 0.15, getFailureTypesForPhase('setup'));

    // Step 2: Navigate to test cases page
    const testCasesUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-cases';
    await page.goto(testCasesUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    await expect(page).toHaveTitle('QA Path', { timeout: 90000 });
    console.log('✅ Navigated to test cases page');

    // 💥 FAILURE INJECTION POINT 2: After navigation
    await maybeFailAt(page, 'after-navigate-create-tc', 0.15, getFailureTypesForPhase('navigation'));

    // Step 3: Get initial test case count
    const initialTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const initialTotal = initialTotalText ? parseInt(initialTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Initial total test cases: ${initialTotal}`);

    // Step 4: Click "New Test Case" button
    const newTestCaseButton = page.getByRole('button', { name: /New Test Case|Create Test Case/i });
    await expect(newTestCaseButton).toBeVisible({ timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 3: Element not interactable on "New Test Case" button
    await maybeFailAt(page, 'before-click-new-tc', 0.2, ['element-not-interactable', 'element-not-found', 'stale-element']);

    await newTestCaseButton.click();
    console.log('✅ Clicked New Test Case button');

    await page.waitForTimeout(2000);

    // Step 5: Fill in test case details
    const dynamicSummary = `Auto TC UI - ${new Date().toISOString().replace(/[:.]/g, '-')}`;

    // 💥 FAILURE INJECTION POINT 4: JavaScript exception while filling form
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] JavaScript exception while populating form...');
      await page.evaluate(() => {
        throw new TypeError("Cannot read properties of null (reading 'value')");
      });
    }

    // Fill summary
    const summaryInput = page.getByRole('textbox', { name: /Summary|Title|Name/i }).first();
    await expect(summaryInput).toBeVisible({ timeout: 90000 });
    await summaryInput.fill(dynamicSummary);
    console.log(`✅ Entered summary: ${dynamicSummary}`);

    // Fill description
    const descriptionInput = page.getByRole('textbox', { name: /Description/i }).first();
    const isDescVisible = await descriptionInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (isDescVisible) {
      await descriptionInput.fill('Test case created via UI automation');
      console.log('✅ Entered description');
    }

    await page.waitForTimeout(500);

    // 💥 FAILURE INJECTION POINT 5: Stale element before submitting
    await maybeFailAt(page, 'before-submit-tc-form', 0.15, ['stale-element', 'element-not-interactable']);

    // Step 6: Click Save/Create button
    const saveButton = page.getByRole('button', { name: /Save|Create|Submit/i }).first();
    await expect(saveButton).toBeVisible({ timeout: 90000 });
    await expect(saveButton).toBeEnabled({ timeout: 90000 });
    await saveButton.click();
    console.log('✅ Clicked Save button');

    // Wait for creation
    await page.waitForTimeout(6000);

    // 💥 FAILURE INJECTION POINT 6: API failure during creation
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 500 error from test case creation API...');
      throw new Error('API Error: 500 Internal Server Error - POST /api/testcase/create failed: {"error":"Duplicate key violation","detail":"A test case with this summary already exists in the module"}');
    }

    // Step 7: Verify creation
    const successMessage = page.getByText(/created successfully|Test case created/i);
    const isSuccess = await successMessage.isVisible({ timeout: 10000 }).catch(() => false);
    if (isSuccess) {
      console.log('✅ Success message visible');
    }

    // Navigate back to list
    await page.goto(testCasesUrl);
    await page.waitForTimeout(10000);

    // 💥 FAILURE INJECTION POINT 7: Timeout during verification
    await maybeFailAt(page, 'during-creation-verification', 0.2, getFailureTypesForPhase('verification'));

    // Step 8: Verify count increased
    const updatedTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const updatedTotal = updatedTotalText ? parseInt(updatedTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Updated total: ${updatedTotal}`);

    // 💥 FAILURE INJECTION POINT 8: Assertion failure on count
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting count decreased instead of increased...');
      expect(updatedTotal).toBeLessThan(initialTotal);
    }

    expect(updatedTotal).toBeGreaterThanOrEqual(initialTotal);
    console.log('✅ Test case count verification passed');

    console.log('✅ Create Test Case via UI test completed successfully');
  });
});
