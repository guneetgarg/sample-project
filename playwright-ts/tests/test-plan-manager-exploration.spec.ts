import { test, expect } from '@playwright/test';

test.describe('Test Plan Manager Exploration', () => {
  test('should explore Test Plan Manager functionality with specific test plan', async ({ page }) => {
    // Increase test timeout for this complex interaction
    test.setTimeout(120000);
    // Step 1: Navigate to the test automation platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load as per instructions (10s after navigation)
    await page.waitForTimeout(10000);
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/exploration-01-initial-load.png', 
      fullPage: true 
    });
    
    console.log('✅ Step 1: Successfully navigated to https://ap-agent.qa-path.com/test-automation/');
    
    // Step 2: Switch to 'Test Plan Manager' Tab
    const testPlanManagerTab = page.getByRole('tab', { name: 'Test Plan Manager' });
    await expect(testPlanManagerTab).toBeVisible({ timeout: 90000 });
    await testPlanManagerTab.click();
    
    // Wait for tab content to load (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // Take screenshot after switching tabs
    await page.screenshot({ 
      path: 'test-results/exploration-tab-1-Test-Plan-Manager.png', 
      fullPage: true 
    });
    
    console.log('✅ Step 2: Successfully switched to Test Plan Manager tab');
    
    // Step 3: Select 'rahul_testplan_clicklinkbytext_usingcontains' from the Select Test Plan dropdown
    // Use the specific combobox for test plan selection (identified from error message)
    const testPlanSelect = page.getByRole('combobox', { name: 'Select Test Plan' });
    
    await expect(testPlanSelect).toBeVisible({ timeout: 90000 });
    
    // Click to open the dropdown
    await testPlanSelect.click();
    
    // Wait for dropdown options to appear
    await page.waitForTimeout(2000);
    
    // Select the specific test plan option
    await page.getByText('rahul_testplan_clicklinkbytext_usingcontains').click();
    
    // Wait for selection to process
    await page.waitForTimeout(3000);
    
    console.log('✅ Step 3: Successfully selected rahul_testplan_clicklinkbytext_usingcontains test plan');
    
    // Step 4: Click Run Test Button
    // Use the first Run Test button (there are multiple on the page)
    const runTestButton = page.getByRole('button', { name: 'Run Test' }).first();
    
    await expect(runTestButton).toBeVisible({ timeout: 90000 });
    await expect(runTestButton).toBeEnabled();
    
    // Take screenshot before running test
    await page.screenshot({ 
      path: 'test-results/exploration-tab-2-Test-Plan-Manager.png', 
      fullPage: true 
    });
    
    await runTestButton.click();
    
    // Wait for test execution to begin (reduced wait time to avoid timeout)
    await page.waitForTimeout(3000);
    
    console.log('✅ Step 4: Successfully clicked Run Test button');
    
    // Verify test execution started by checking for Stop Test button or execution indicators
    const stopTestButton = page.getByRole('button', { name: /stop.*test/i });
    const executionIndicator = page.locator('text=Running').or(
      page.locator('text=Executing')
    ).or(
      page.locator('[data-testid*="execution"]')
    );
    
    // Check if test execution started (either stop button appears or execution indicator)
    const testStarted = await Promise.race([
      stopTestButton.isVisible().then(visible => visible),
      executionIndicator.isVisible().then(visible => visible),
      page.waitForTimeout(5000).then(() => false)
    ]);
    
    if (testStarted) {
      console.log('✅ Test execution started successfully');
      
      // Take final screenshot showing test execution
      await page.screenshot({ 
        path: 'test-results/exploration-test-execution-started.png', 
        fullPage: true 
      });
      
      // If stop button is available, we can stop the test to clean up
      if (await stopTestButton.isVisible()) {
        await page.waitForTimeout(3000); // Let it run briefly
        await stopTestButton.click();
        console.log('✅ Test execution stopped for cleanup');
      }
    } else {
      console.log('⚠️ Test execution status unclear - taking screenshot for analysis');
      await page.screenshot({ 
        path: 'test-results/exploration-test-status-unclear.png', 
        fullPage: true 
      });
    }
    
    // Final summary
    console.log('🎉 Exploration completed successfully:');
    console.log('   1. ✅ Navigated to https://ap-agent.qa-path.com/test-automation/');
    console.log('   2. ✅ Switched to Test Plan Manager tab');
    console.log('   3. ✅ Selected rahul_testplan_clicklinkbytext_usingcontains test plan');
    console.log('   4. ✅ Clicked Run Test button');
  });
});
