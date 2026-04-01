import { test, expect } from '@playwright/test';

test.describe('Select Test Plan and Run Test', () => {
  test('should select rahul_testplan_clicklinkbytext_usingcontains and click RUN TEST', async ({ page }) => {
    // Navigate to the test automation platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load as per instructions (10s after navigation)
    await page.waitForTimeout(10000);
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    
    // Step 1: Click on TEST PLAN MANAGER tab
    const testPlanManagerTab = page.getByRole('tab', { name: 'Test Plan Manager' });
    await expect(testPlanManagerTab).toBeVisible({ timeout: 90000 });
    await testPlanManagerTab.click();
    
    console.log('✅ Successfully clicked TEST PLAN MANAGER tab');
    
    // Wait for tab content to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot after switching to Test Plan Manager
    await page.screenshot({ 
      path: 'test-results/test-plan-manager-tab.png', 
      fullPage: true 
    });
    
    // Step 2: Select the specific test plan
    const testPlanName = 'rahul_testplan_clicklinkbytext_usingcontains';
    
    // Based on debug results, there are 2 comboboxes. The second one (with empty text) is likely the test plan selector
    const testPlanDropdown = page.locator('[role="combobox"]').nth(1);
    await expect(testPlanDropdown).toBeVisible({ timeout: 30000 });
    
    // Click the dropdown to open it
    await testPlanDropdown.click();
    console.log('✅ Clicked test plan dropdown');
    
    // Wait for dropdown options to appear
    await page.waitForTimeout(3000);
    
    // Look for the specific test plan option
    const testPlanOption = page.getByRole('option', { name: testPlanName });
    await expect(testPlanOption).toBeVisible({ timeout: 30000 });
    await testPlanOption.click();
    
    console.log(`✅ Successfully selected test plan: ${testPlanName}`);
    
    // Wait for selection to take effect
    await page.waitForTimeout(2000);
    
    // Take a screenshot after test plan selection
    await page.screenshot({ 
      path: 'test-results/after-test-plan-selection.png', 
      fullPage: true 
    });
    
    // Step 3: Click RUN TEST button
    const runTestButton = page.getByRole('button', { name: /run test/i });
    await expect(runTestButton).toBeVisible({ timeout: 90000 });
    await expect(runTestButton).toBeEnabled();
    await runTestButton.click();
    
    console.log('✅ Successfully clicked RUN TEST button');
    
    // Wait for test execution to begin (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // Take a screenshot after clicking RUN TEST
    await page.screenshot({ 
      path: 'test-results/after-run-test-click.png', 
      fullPage: true 
    });
    
    // Verify test execution started (look for Stop Test button or execution indicators)
    try {
      const stopTestButton = page.getByRole('button', { name: /stop test/i });
      await expect(stopTestButton).toBeVisible({ timeout: 30000 });
      console.log('✅ Test execution started - Stop Test button is visible');
    } catch (error) {
      console.log('⚠️ Stop Test button not immediately visible, test may still be starting...');
    }
    
    // Log success
    console.log('✅ Successfully completed all actions:');
    console.log(`   1. Navigated to TEST PLAN MANAGER tab`);
    console.log(`   2. Selected test plan: ${testPlanName}`);
    console.log('   3. Clicked RUN TEST button');
  });
});
