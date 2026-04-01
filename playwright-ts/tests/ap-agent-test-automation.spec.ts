import { test, expect } from '@playwright/test';

test.describe('AP Agent Test Automation Platform', () => {
  test('should load test automation platform and interact with test execution', async ({ page }) => {
    // Navigate to the test automation platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load as per instructions (10s after navigation)
    await page.waitForTimeout(10000);
    
    // Verify page loaded correctly with proper title
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    
    // Verify main heading is visible
    await expect(page.getByRole('heading', { name: 'Test Automation Platform' })).toBeVisible({ timeout: 90000 });
    
    // Verify key sections are present
    await expect(page.getByRole('heading', { name: 'Test Scenario' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Progress' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Live Execution Flow' })).toBeVisible();
    
    // Verify sample scenario buttons are available
    await expect(page.getByRole('button', { name: 'Basic Navigation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Drag and Drop Test' })).toBeVisible();
    
    // Test the core functionality - clicking on a sample scenario
    await page.getByRole('button', { name: 'Basic Navigation' }).click();
    
    // Wait for any dynamic content to load after selection
    await page.waitForTimeout(2000);
    
    // Verify Run Test button is available and clickable
    const runTestButton = page.getByRole('button', { name: 'Run Test' });
    await expect(runTestButton).toBeVisible();
    await expect(runTestButton).toBeEnabled();
    
    // Click Run Test to start test execution
    await runTestButton.click();
    
    // Wait for test execution to begin (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // Verify Stop Test button becomes available during execution
    const stopTestButton = page.getByRole('button', { name: 'Stop Test' });
    await expect(stopTestButton).toBeVisible({ timeout: 90000 });
    
    // Verify test progress section shows activity
    const testProgressSection = page.locator('text=Test Progress').locator('..');
    await expect(testProgressSection).toBeVisible();
    
    // Take a screenshot of the test execution state
    await page.screenshot({ 
      path: 'test-results/test-execution-state.png', 
      fullPage: true 
    });
    
    // Stop the test execution
    await stopTestButton.click();
    
    // Wait for test to stop
    await page.waitForTimeout(3000);
    
    // Verify Run Test button is available again after stopping
    await expect(runTestButton).toBeVisible();
    await expect(runTestButton).toBeEnabled();
    
    console.log('✅ Successfully tested AP Agent Test Automation Platform core functionality');
  });

  test('should test drag and drop scenario selection', async ({ page }) => {
    // Navigate to the test automation platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load
    await page.waitForTimeout(10000);
    
    // Verify page is loaded
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    
    // Test the Drag and Drop Test scenario
    const dragDropButton = page.getByRole('button', { name: 'Drag and Drop Test' });
    await expect(dragDropButton).toBeVisible();
    await dragDropButton.click();
    
    // Wait for scenario to load
    await page.waitForTimeout(3000);
    
    // Verify Run Test button is still available
    await expect(page.getByRole('button', { name: 'Run Test' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run Test' })).toBeEnabled();
    
    console.log('✅ Successfully tested Drag and Drop scenario selection');
  });

  test('should verify all interactive elements are accessible', async ({ page }) => {
    // Navigate to the test automation platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load
    await page.waitForTimeout(10000);
    
    // Verify page is loaded
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    
    // Check all buttons are accessible and visible
    const buttons = ['Basic Navigation', 'Drag and Drop Test', 'Run Test', 'Stop Test'];
    
    for (const buttonName of buttons) {
      const button = page.getByRole('button', { name: buttonName });
      await expect(button).toBeVisible({ timeout: 90000 });
      
      // Log button accessibility
      const isEnabled = await button.isEnabled();
      console.log(`Button "${buttonName}" is ${isEnabled ? 'enabled' : 'disabled'}`);
    }
    
    // Verify input fields are present (found 5 during exploration)
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(5);
    
    console.log(`✅ Found ${inputCount} input fields as expected`);
    console.log('✅ All interactive elements are accessible');
  });
});
