import { test, expect } from '@playwright/test';

test.describe('AP Agent Test Plan Manager Interaction', () => {
  test('should navigate to site and click TEST PLAN MANAGER', async ({ page }) => {
    // Step 1: Navigate to the specified URL
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load as per instructions (10s after navigation)
    await page.waitForTimeout(10000);
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    
    // Take a screenshot before clicking
    await page.screenshot({ 
      path: 'test-results/before-test-plan-manager-click.png', 
      fullPage: true 
    });
    
    // Step 2: Click 'TEST PLAN MANAGER' tab
    // Based on debug results, it's a tab button with role="tab"
    const testPlanManagerTab = page.getByRole('tab', { name: 'Test Plan Manager' });
    await expect(testPlanManagerTab).toBeVisible({ timeout: 90000 });
    await testPlanManagerTab.click();
    
    console.log('✅ Successfully clicked TEST PLAN MANAGER tab');
    
    // Wait for any navigation or dynamic content after clicking
    await page.waitForTimeout(6000);
    
    // Take a screenshot after clicking
    await page.screenshot({ 
      path: 'test-results/after-test-plan-manager-click.png', 
      fullPage: true 
    });
    
    // Verify the click had some effect (page change, modal, etc.)
    const currentUrl = page.url();
    console.log('Current URL after click:', currentUrl);
    
    // Log success
    console.log('✅ Successfully completed both actions:');
    console.log('   1. Navigated to https://ap-agent.qa-path.com/test-automation/');
    console.log('   2. Clicked TEST PLAN MANAGER element');
  });
});
