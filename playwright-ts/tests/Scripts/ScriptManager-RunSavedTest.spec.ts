import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

test.describe('Script Manager - Run Saved Test', () => {
  test('should select a test case and run it from Script Manager', async ({ page }) => {
    // Set a reasonable timeout for this test
    test.setTimeout(300000); // 5 minutes to allow for test execution

    console.log('🚀 Starting Script Manager - Run Saved Test test...');

    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    console.log('📋 Section 1: Setup and Login');

    // Step 1: Login using the reusable helper
    await login(page);
    console.log('✅ Login completed');

    // ============================================
    // SECTION 2: Navigate to Script Manager Page
    // ============================================
    console.log('📋 Section 2: Navigate to Script Manager Page');

    const projectId = 'd7735c45-30e0-417a-806f-524b000bf75d';
    const scriptManagerUrl = `https://qa-path.com/home/projects/${projectId}/execution-replay`;

    await page.goto(scriptManagerUrl);
    console.log(`✅ Navigated to Script Manager: ${scriptManagerUrl}`);

    // Wait for page to load (10s after navigation as per instructions)
    await page.waitForTimeout(10000);

    // Verify we're on the Script Manager page
    await expect(page).toHaveURL(new RegExp('/execution-replay'), { timeout: 90000 });
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });

    // Verify Script Manager page content is visible
    const scriptManagerHeading = page.getByText(/Script Manager/i);
    await expect(scriptManagerHeading).toBeVisible({ timeout: 90000 });
    console.log('✅ Script Manager page loaded');

    // ============================================
    // SECTION 3: Select Test Case
    // ============================================
    console.log('📋 Section 3: Select Test Case');

    // Step 2: Locate and click the "Select Test Case" dropdown
    const selectTestCaseLabel = page.getByText(/Select Test Case/i);
    await expect(selectTestCaseLabel).toBeVisible({ timeout: 90000 });

    // Find the combobox/dropdown associated with "Select Test Case"
    const testCaseDropdown = page.getByRole('combobox').filter({ hasText: /Select Test Case|QAPA/i }).first();
    
    // Alternative: Find by looking near the label
    let testCaseSelector = selectTestCaseLabel.locator('..').locator('[role="combobox"], select, button').first();
    let selectorFound = await testCaseSelector.isVisible({ timeout: 5000 }).catch(() => false);

    if (!selectorFound) {
      // Try finding the combobox that contains "Select Test Case" text or is near it
      testCaseSelector = page.locator('[role="combobox"]').first();
      selectorFound = await testCaseSelector.isVisible({ timeout: 5000 }).catch(() => false);
    }

    if (!selectorFound) {
      await page.screenshot({ path: 'test-results/test-case-selector-not-found.png', fullPage: true });
      throw new Error('Test Case selector not found on the page');
    }

    await expect(testCaseSelector).toBeVisible({ timeout: 90000 });
    await testCaseSelector.scrollIntoViewIfNeeded();
    await testCaseSelector.click();
    console.log('✅ Clicked Test Case selector');

    // Wait for dropdown to appear
    await page.waitForTimeout(1500);

    // Step 3: Search for and select test case QAPA-2
    const testCaseToSelect = 'QAPA-2';
    console.log(`🔍 Searching for test case: ${testCaseToSelect}`);

    // Type to search for the test case
    await testCaseSelector.fill(testCaseToSelect);
    await page.waitForTimeout(1000);

    // Find and click the option containing QAPA-2
    const testCaseOption = page.getByRole('option').filter({ hasText: new RegExp(testCaseToSelect, 'i') }).first();
    const optionFound = await testCaseOption.isVisible({ timeout: 5000 }).catch(() => false);

    if (!optionFound) {
      // Try alternative: look for any option with QAPA-2 text
      const allOptions = page.locator('[role="option"]').filter({ hasText: /QAPA-2/i });
      const optionCount = await allOptions.count();
      
      if (optionCount > 0) {
        await allOptions.first().click();
        console.log(`✅ Selected test case: ${testCaseToSelect}`);
      } else {
        await page.screenshot({ path: 'test-results/test-case-option-not-found.png', fullPage: true });
        throw new Error(`Test case ${testCaseToSelect} not found in dropdown`);
      }
    } else {
      await expect(testCaseOption).toBeVisible({ timeout: 90000 });
      await testCaseOption.click();
      console.log(`✅ Selected test case: ${testCaseToSelect}`);
    }

    // Wait for test case to be selected and page to update
    await page.waitForTimeout(2000);

    // Verify test case is selected
    const selectedTestCase = page.getByText(new RegExp(testCaseToSelect, 'i'));
    await expect(selectedTestCase).toBeVisible({ timeout: 90000 });
    console.log(`✅ Verified test case ${testCaseToSelect} is selected`);

    // ============================================
    // SECTION 4: Run Test
    // ============================================
    console.log('📋 Section 4: Run Test');

    // Step 4: Locate and click the "Run Test" button
    const runTestButton = page.getByRole('button', { name: 'Run Test' });
    await expect(runTestButton).toBeVisible({ timeout: 90000 });
    await expect(runTestButton).toBeEnabled({ timeout: 90000 });
    
    await runTestButton.scrollIntoViewIfNeeded();
    await runTestButton.click();
    console.log('✅ Clicked Run Test button');

    // Wait for test execution to start
    await page.waitForTimeout(2000);

    // Verify execution started
    const executionStartedMessage = page.getByText(/Automation script replaying|Replay in progress/i).first();
    const isExecutionStarted = await executionStartedMessage.isVisible({ timeout: 10000 }).catch(() => false);
    if (isExecutionStarted) {
      console.log('✅ Test execution started');
    }

    // ============================================
    // SECTION 5: Wait for Execution to Complete
    // ============================================
    console.log('📋 Section 5: Wait for Execution to Complete');

    // Step 5: Wait for "Automation script replaying..." message to disappear
    console.log('⏳ Waiting for test execution to complete...');
    
    const replayingMessage = page.getByText(/Automation script replaying|Replay in progress/i).first();
    await replayingMessage.waitFor({ state: 'hidden', timeout: 300000 }); // 5 minutes max wait
    
    // Wait a bit more for the status to update
    await page.waitForTimeout(3000);

    // Verify execution completed message appears
    const executionCompletedMessage = page.getByText(/Automation script executed successfully/i).first();
    await expect(executionCompletedMessage).toBeVisible({ timeout: 90000 });
    console.log('✅ Test execution completed');

    // ============================================
    // SECTION 6: Verify Test Results
    // ============================================
    console.log('📋 Section 6: Verify Test Results');

    // Step 6: Verify results are displayed
    const resultsTab = page.getByRole('tab', { name: 'Results' });
    await expect(resultsTab).toBeVisible({ timeout: 90000 });
    
    // Check if Results tab is selected, if not click it
    const isSelected = await resultsTab.getAttribute('aria-selected');
    if (isSelected !== 'true') {
      await resultsTab.click();
      await page.waitForTimeout(1000);
    }

    // Verify overall status is displayed
    const overallStatus = page.getByText(/Overall Status/i);
    await expect(overallStatus).toBeVisible({ timeout: 90000 });
    console.log('✅ Results section is visible');

    // Extract and verify test results
    const totalStepsText = await page.getByText(/Total/i).first().textContent();
    const passedStepsText = await page.getByText(/Passed/i).first().textContent();
    const failedStepsText = await page.getByText(/Failed/i).first().textContent();

    console.log(`📊 Test Results Summary:`);
    console.log(`   ${totalStepsText}`);
    console.log(`   ${passedStepsText}`);
    console.log(`   ${failedStepsText}`);

    // Verify that at least one step was executed
    const totalMatch = totalStepsText?.match(/\d+/);
    const totalSteps = totalMatch ? parseInt(totalMatch[0]) : 0;
    expect(totalSteps).toBeGreaterThan(0);
    console.log(`✅ Verified ${totalSteps} step(s) were executed`);

    // Verify execution steps are visible
    const executionStepsHeading = page.getByRole('heading', { name: /Execution Steps/i });
    await expect(executionStepsHeading).toBeVisible({ timeout: 90000 });
    console.log('✅ Execution Steps section is visible');

    // Verify at least one step is displayed
    const stepButtons = page.getByRole('button').filter({ hasText: /Step \d+:/i });
    const stepCount = await stepButtons.count();
    expect(stepCount).toBeGreaterThan(0);
    console.log(`✅ Verified ${stepCount} execution step(s) are displayed`);

    // Verify "Run Test" button is enabled again (indicating execution is complete)
    const runTestButtonAfter = page.getByRole('button', { name: 'Run Test' });
    await expect(runTestButtonAfter).toBeEnabled({ timeout: 90000 });
    console.log('✅ Run Test button is enabled (execution complete)');

    // Verify "Stop Execution" button is disabled
    const stopExecutionButton = page.getByRole('button', { name: 'Stop Execution' });
    const isStopDisabled = await stopExecutionButton.isDisabled().catch(() => true);
    expect(isStopDisabled).toBe(true);
    console.log('✅ Stop Execution button is disabled (execution complete)');

    console.log('✅ Script Manager - Run Saved Test test completed successfully');
  });
});

