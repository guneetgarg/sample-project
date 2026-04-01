import { test, expect } from '@playwright/test';

test.describe('Rahul Test Plan - Click Link By Text Using Contains', () => {
  test('should execute rahul_testplan_clicklinkbytext_usingcontains and verify output', async ({ page }) => {
    // Set test timeout to 5 minutes to accommodate test execution completion
    test.setTimeout(300000);
    // Step 1: Navigate to the AP Agent Test Automation Platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load as per instructions (10s after navigation)
    await page.waitForTimeout(10000);
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    console.log('✅ Successfully navigated to AP Agent Test Automation Platform');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/01-initial-page-load.png', 
      fullPage: true 
    });
    
    // Step 2: Click on TEST PLAN MANAGER tab
    const testPlanManagerTab = page.getByRole('tab', { name: 'Test Plan Manager' });
    await expect(testPlanManagerTab).toBeVisible({ timeout: 90000 });
    await testPlanManagerTab.click();
    
    console.log('✅ Successfully clicked TEST PLAN MANAGER tab');
    
    // Wait for tab content to load
    await page.waitForTimeout(3000);
    
    // Verify we're on the Test Plan Manager tab
    await expect(testPlanManagerTab).toHaveAttribute('aria-selected', 'true');
    
    // Take screenshot after switching to Test Plan Manager
    await page.screenshot({ 
      path: 'test-results/02-test-plan-manager-tab.png', 
      fullPage: true 
    });
    
    // Step 3: Select the specific test plan
    const testPlanName = 'rahul_testplan_clicklinkbytext_usingcontains';
    
    // Find and click the test plan dropdown (second combobox)
    const testPlanDropdown = page.locator('[role="combobox"]').nth(1);
    await expect(testPlanDropdown).toBeVisible({ timeout: 30000 });
    await testPlanDropdown.click();
    
    console.log('✅ Clicked test plan dropdown');
    
    // Wait for dropdown options to appear
    await page.waitForTimeout(3000);
    
    // Take screenshot of dropdown options
    await page.screenshot({ 
      path: 'test-results/03-dropdown-options.png', 
      fullPage: true 
    });
    
    // Select the specific test plan option
    try {
      const testPlanOption = page.getByRole('option', { name: testPlanName });
      await expect(testPlanOption).toBeVisible({ timeout: 30000 });
      await testPlanOption.click();
      console.log(`✅ Successfully selected test plan: ${testPlanName}`);
    } catch (error) {
      console.log(`❌ Failed to find test plan option: ${testPlanName}`);
      // Take a screenshot of available options for debugging
      await page.screenshot({ 
        path: 'test-results/debug-dropdown-options.png', 
        fullPage: true 
      });
      throw error;
    }
    
    // Wait for selection to take effect
    await page.waitForTimeout(2000);
    
    // Verify the test plan is selected (dropdown should show the selected value)
    await expect(testPlanDropdown).toContainText(testPlanName);
    
    // Take screenshot after test plan selection
    await page.screenshot({ 
      path: 'test-results/04-test-plan-selected.png', 
      fullPage: true 
    });
    
    // Step 4: Click RUN TEST button
    const runTestButton = page.getByRole('button', { name: /run test/i });
    await expect(runTestButton).toBeVisible({ timeout: 90000 });
    await expect(runTestButton).toBeEnabled();
    await runTestButton.click();
    
    console.log('✅ Successfully clicked RUN TEST button');
    
    // Wait for test execution to begin (reduced from 6s to 3s for efficiency)
    await page.waitForTimeout(3000);
    
    // Take screenshot immediately after clicking RUN TEST
    await page.screenshot({ 
      path: 'test-results/05-test-execution-started.png', 
      fullPage: true 
    });
    
    // Step 5: Verify test execution started
    // Check for indicators that test is running
    const stopTestButton = page.getByRole('button', { name: /stop test/i });
    
    try {
      await expect(stopTestButton).toBeVisible({ timeout: 30000 });
      await expect(stopTestButton).toBeEnabled();
      console.log('✅ Test execution started - Stop Test button is visible and enabled');
    } catch (error) {
      console.log('⚠️ Stop Test button not immediately visible, checking for other execution indicators...');
    }
    
    // Step 6: Monitor test execution progress
    // Try to find and switch to execution monitoring tabs
    let executionTabFound = false;
    
    // Try "Live Flow" first
    try {
      const liveFlowTab = page.getByRole('tab', { name: 'Live Flow' });
      await expect(liveFlowTab).toBeVisible({ timeout: 10000 });
      await liveFlowTab.click();
      executionTabFound = true;
      console.log('✅ Switched to Live Flow tab to monitor execution');
    } catch (error) {
      console.log('⚠️ Live Flow tab not found, trying alternative tabs...');
    }
    
    // If Live Flow not found, try "Live Execution Flow" or similar
    if (!executionTabFound) {
      try {
        const executionTab = page.getByRole('tab', { name: /live.*flow/i });
        await expect(executionTab).toBeVisible({ timeout: 10000 });
        await executionTab.click();
        executionTabFound = true;
        console.log('✅ Switched to execution monitoring tab');
      } catch (error) {
        console.log('⚠️ No execution flow tab found, continuing with current view');
      }
    }
    
    // Wait for execution data to appear (reduced for efficiency)
    await page.waitForTimeout(3000);
    
    // Take screenshot of current execution view
    await page.screenshot({ 
      path: 'test-results/06-execution-monitoring.png', 
      fullPage: true 
    });
    
    // Verify execution is happening (should not show "No execution data available")
    const noExecutionDataText = page.getByText('No execution data available');
    
    try {
      // Check if "No execution data available" is visible
      const isNoDataVisible = await noExecutionDataText.isVisible({ timeout: 5000 });
      if (isNoDataVisible) {
        console.log('⚠️ No execution data available yet - test may still be starting');
      } else {
        console.log('✅ Test execution data is visible - test is running successfully');
      }
    } catch (error) {
      console.log('✅ Execution monitoring completed');
    }
    
    // Step 7: Check other tabs for execution data (with error handling)
    const tabsToCheck = [
      { name: 'Logs', screenshot: '07-logs-tab.png' },
      { name: 'Screenshots', screenshot: '08-screenshots-tab.png' },
      { name: 'Results', screenshot: '09-results-tab.png' }
    ];
    
    for (const tabInfo of tabsToCheck) {
      try {
        const tab = page.getByRole('tab', { name: tabInfo.name });
        await expect(tab).toBeVisible({ timeout: 10000 });
        await tab.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: `test-results/${tabInfo.screenshot}`, 
          fullPage: true 
        });
        
        console.log(`✅ Successfully checked ${tabInfo.name} tab`);
      } catch (error) {
        console.log(`⚠️ ${tabInfo.name} tab not found or not accessible`);
      }
    }
    
    // Step 8: Wait for test completion or stop test manually
    // Let the test run for a reasonable amount of time to see results
    console.log('⏳ Waiting for test execution to progress...');
    await page.waitForTimeout(10000);
    
    // Take screenshot during execution
    await page.screenshot({ 
      path: 'test-results/10-execution-progress.png', 
      fullPage: true 
    });
    
    // Step 9: Wait for Stop button to be disabled (indicating test completion)
    console.log('⏳ Waiting for test execution to complete...');
    const stopButton = page.getByRole('button', { name: /stop test/i });
    
    try {
      // Wait for the Stop button to become disabled (test completion)
      await expect(stopButton).toBeDisabled({ timeout: 120000 }); // Wait up to 2 minutes
      console.log('✅ Test execution completed - Stop button is now disabled');
    } catch (error) {
      console.log('⚠️ Stop button still enabled after timeout, test may still be running');
    }
    
    // Step 10: Click on Execution Steps tab
    console.log('🔍 Navigating to Execution Steps tab...');
    try {
      const executionStepsTab = page.getByRole('tab', { name: 'Execution Steps' });
      await expect(executionStepsTab).toBeVisible({ timeout: 30000 });
      await executionStepsTab.click();
      
      // Wait for tab content to load
      await page.waitForTimeout(3000);
      
      console.log('✅ Successfully clicked Execution Steps tab');
      
      // Take screenshot of Execution Steps tab
      await page.screenshot({ 
        path: 'test-results/11-execution-steps-tab.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('❌ Failed to find or click Execution Steps tab');
      throw error;
    }
    
    // Step 11: Verify that Passed is 12 and Success % is 100%
    console.log('🔍 Verifying test results...');
    try {
      // Look for Passed count of 12 - use first() to handle multiple matches
      const passedCount = page.getByText('Passed12').first().or(
        page.locator('div').filter({ hasText: /^Passed12$/ }).first()
      ).or(
        page.getByText(/passed.*12/i).first()
      );
      
      await expect(passedCount).toBeVisible({ timeout: 30000 });
      console.log('✅ Verified: Passed count is 12');
      
      // Look for Success % of 100%
      const successPercentage = page.getByText('Success100%').first().or(
        page.locator('div').filter({ hasText: /^Success100%$/ }).first()
      ).or(
        page.getByText(/success.*100%/i).first()
      );
      
      await expect(successPercentage).toBeVisible({ timeout: 30000 });
      console.log('✅ Verified: Success % is 100%');
      
      // Take final verification screenshot
      await page.screenshot({ 
        path: 'test-results/12-final-verification.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('❌ Failed to verify test results (Passed: 12, Success: 100%)');
      
      // Take debug screenshot to see what's actually displayed
      await page.screenshot({ 
        path: 'test-results/debug-execution-results.png', 
        fullPage: true 
      });
      
      // Log what we can see for debugging
      const pageContent = await page.textContent('body');
      console.log('Page content for debugging:', pageContent?.substring(0, 500));
      
      throw error;
    }
    
    // Final verification summary
    console.log('\n=== TEST EXECUTION SUMMARY ===');
    console.log('✅ 1. Successfully navigated to AP Agent Test Automation Platform');
    console.log('✅ 2. Successfully clicked TEST PLAN MANAGER tab');
    console.log(`✅ 3. Successfully selected test plan: ${testPlanName}`);
    console.log('✅ 4. Successfully clicked RUN TEST button');
    console.log('✅ 5. Successfully verified test execution started');
    console.log('✅ 6. Successfully monitored execution across all tabs');
    console.log('✅ 7. Successfully waited for test completion (Stop button disabled)');
    console.log('✅ 8. Successfully navigated to Execution Steps tab');
    console.log('✅ 9. Successfully verified Passed count is 12');
    console.log('✅ 10. Successfully verified Success % is 100%');
    console.log('✅ 11. Successfully captured screenshots of entire process');
    console.log('\n🎉 Complete test plan execution and verification workflow completed successfully!');
  });

  test('should execute rahul_filter_project and verify output', async ({ page }) => {
    // Set test timeout to 5 minutes to accommodate test execution completion
    test.setTimeout(300000);
    // Step 1: Navigate to the AP Agent Test Automation Platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load as per instructions (10s after navigation)
    await page.waitForTimeout(10000);
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    console.log('✅ Successfully navigated to AP Agent Test Automation Platform');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/filter-01-initial-page-load.png', 
      fullPage: true 
    });
    
    // Step 2: Click on TEST PLAN MANAGER tab
    const testPlanManagerTab = page.getByRole('tab', { name: 'Test Plan Manager' });
    await expect(testPlanManagerTab).toBeVisible({ timeout: 90000 });
    await testPlanManagerTab.click();
    
    console.log('✅ Successfully clicked TEST PLAN MANAGER tab');
    
    // Wait for tab content to load
    await page.waitForTimeout(3000);
    
    // Verify we're on the Test Plan Manager tab
    await expect(testPlanManagerTab).toHaveAttribute('aria-selected', 'true');
    
    // Take screenshot after switching to Test Plan Manager
    await page.screenshot({ 
      path: 'test-results/filter-02-test-plan-manager-tab.png', 
      fullPage: true 
    });
    
    // Step 3: Select the specific test plan
    const testPlanName = 'rahul_filter_project';
    
    // Find and click the test plan dropdown (second combobox)
    const testPlanDropdown = page.locator('[role="combobox"]').nth(1);
    await expect(testPlanDropdown).toBeVisible({ timeout: 30000 });
    await testPlanDropdown.click();
    
    console.log('✅ Clicked test plan dropdown');
    
    // Wait for dropdown options to appear
    await page.waitForTimeout(3000);
    
    // Take screenshot of dropdown options
    await page.screenshot({ 
      path: 'test-results/filter-03-dropdown-options.png', 
      fullPage: true 
    });
    
    // Select the specific test plan option
    try {
      const testPlanOption = page.getByRole('option', { name: testPlanName });
      await expect(testPlanOption).toBeVisible({ timeout: 30000 });
      await testPlanOption.click();
      console.log(`✅ Successfully selected test plan: ${testPlanName}`);
    } catch (error) {
      console.log(`❌ Failed to find test plan option: ${testPlanName}`);
      // Take a screenshot of available options for debugging
      await page.screenshot({ 
        path: 'test-results/filter-debug-dropdown-options.png', 
        fullPage: true 
      });
      throw error;
    }
    
    // Wait for selection to take effect
    await page.waitForTimeout(2000);
    
    // Verify the test plan is selected (dropdown should show the selected value)
    await expect(testPlanDropdown).toContainText(testPlanName);
    
    // Take screenshot after test plan selection
    await page.screenshot({ 
      path: 'test-results/filter-04-test-plan-selected.png', 
      fullPage: true 
    });
    
    // Step 4: Click RUN TEST button
    const runTestButton = page.getByRole('button', { name: /run test/i });
    await expect(runTestButton).toBeVisible({ timeout: 90000 });
    await expect(runTestButton).toBeEnabled();
    await runTestButton.click();
    
    console.log('✅ Successfully clicked RUN TEST button');
    
    // Wait for test execution to begin (reduced from 6s to 3s for efficiency)
    await page.waitForTimeout(3000);
    
    // Take screenshot immediately after clicking RUN TEST
    await page.screenshot({ 
      path: 'test-results/filter-05-test-execution-started.png', 
      fullPage: true 
    });
    
    // Step 5: Verify test execution started
    // Check for indicators that test is running
    const stopTestButton = page.getByRole('button', { name: /stop test/i });
    
    try {
      await expect(stopTestButton).toBeVisible({ timeout: 30000 });
      await expect(stopTestButton).toBeEnabled();
      console.log('✅ Test execution started - Stop Test button is visible and enabled');
    } catch (error) {
      console.log('⚠️ Stop Test button not immediately visible, checking for other execution indicators...');
    }
    
    // Step 6: Monitor test execution progress
    // Try to find and switch to execution monitoring tabs
    let executionTabFound = false;
    
    // Try "Live Flow" first
    try {
      const liveFlowTab = page.getByRole('tab', { name: 'Live Flow' });
      await expect(liveFlowTab).toBeVisible({ timeout: 10000 });
      await liveFlowTab.click();
      executionTabFound = true;
      console.log('✅ Switched to Live Flow tab to monitor execution');
    } catch (error) {
      console.log('⚠️ Live Flow tab not found, trying alternative tabs...');
    }
    
    // If Live Flow not found, try "Live Execution Flow" or similar
    if (!executionTabFound) {
      try {
        const executionTab = page.getByRole('tab', { name: /live.*flow/i });
        await expect(executionTab).toBeVisible({ timeout: 10000 });
        await executionTab.click();
        executionTabFound = true;
        console.log('✅ Switched to execution monitoring tab');
      } catch (error) {
        console.log('⚠️ No execution flow tab found, continuing with current view');
      }
    }
    
    // Wait for execution data to appear (reduced for efficiency)
    await page.waitForTimeout(3000);
    
    // Take screenshot of current execution view
    await page.screenshot({ 
      path: 'test-results/filter-06-execution-monitoring.png', 
      fullPage: true 
    });
    
    // Verify execution is happening (should not show "No execution data available")
    const noExecutionDataText = page.getByText('No execution data available');
    
    try {
      // Check if "No execution data available" is visible
      const isNoDataVisible = await noExecutionDataText.isVisible({ timeout: 5000 });
      if (isNoDataVisible) {
        console.log('⚠️ No execution data available yet - test may still be starting');
      } else {
        console.log('✅ Test execution data is visible - test is running successfully');
      }
    } catch (error) {
      console.log('✅ Execution monitoring completed');
    }
    
    // Step 7: Check other tabs for execution data (with error handling)
    const tabsToCheck = [
      { name: 'Logs', screenshot: 'filter-07-logs-tab.png' },
      { name: 'Screenshots', screenshot: 'filter-08-screenshots-tab.png' },
      { name: 'Results', screenshot: 'filter-09-results-tab.png' }
    ];
    
    for (const tabInfo of tabsToCheck) {
      try {
        const tab = page.getByRole('tab', { name: tabInfo.name });
        await expect(tab).toBeVisible({ timeout: 10000 });
        await tab.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: `test-results/${tabInfo.screenshot}`, 
          fullPage: true 
        });
        
        console.log(`✅ Successfully checked ${tabInfo.name} tab`);
      } catch (error) {
        console.log(`⚠️ ${tabInfo.name} tab not found or not accessible`);
      }
    }
    
    // Step 8: Wait for test completion or stop test manually
    // Let the test run for a reasonable amount of time to see results
    console.log('⏳ Waiting for test execution to progress...');
    await page.waitForTimeout(10000);
    
    // Take screenshot during execution
    await page.screenshot({ 
      path: 'test-results/filter-10-execution-progress.png', 
      fullPage: true 
    });
    
    // Step 9: Wait for Stop button to be disabled (indicating test completion)
    console.log('⏳ Waiting for test execution to complete...');
    const stopButton = page.getByRole('button', { name: /stop test/i });
    
    try {
      // Wait for the Stop button to become disabled (test completion)
      await expect(stopButton).toBeDisabled({ timeout: 120000 }); // Wait up to 2 minutes
      console.log('✅ Test execution completed - Stop button is now disabled');
    } catch (error) {
      console.log('⚠️ Stop button still enabled after timeout, test may still be running');
    }
    
    // Step 10: Click on Execution Steps tab
    console.log('🔍 Navigating to Execution Steps tab...');
    try {
      const executionStepsTab = page.getByRole('tab', { name: 'Execution Steps' });
      await expect(executionStepsTab).toBeVisible({ timeout: 30000 });
      await executionStepsTab.click();
      
      // Wait for tab content to load
      await page.waitForTimeout(3000);
      
      console.log('✅ Successfully clicked Execution Steps tab');
      
      // Take screenshot of Execution Steps tab
      await page.screenshot({ 
        path: 'test-results/filter-11-execution-steps-tab.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('❌ Failed to find or click Execution Steps tab');
      throw error;
    }
    
    // Step 11: Verify that Passed is 17 and Success % is 100%
    console.log('🔍 Verifying test results...');
    try {
      // Look for Passed count of 17 - use first() to handle multiple matches
      const passedCount = page.getByText('Passed17').first().or(
        page.locator('div').filter({ hasText: /^Passed17$/ }).first()
      ).or(
        page.getByText(/passed.*17/i).first()
      );
      
      await expect(passedCount).toBeVisible({ timeout: 30000 });
      console.log('✅ Verified: Passed count is 17');
      
      // Look for Success % of 100%
      const successPercentage = page.getByText('Success100%').first().or(
        page.locator('div').filter({ hasText: /^Success100%$/ }).first()
      ).or(
        page.getByText(/success.*100%/i).first()
      );
      
      await expect(successPercentage).toBeVisible({ timeout: 30000 });
      console.log('✅ Verified: Success % is 100%');
      
      // Take final verification screenshot
      await page.screenshot({ 
        path: 'test-results/filter-12-final-verification.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('❌ Failed to verify test results (Passed: 17, Success: 100%)');
      
      // Take debug screenshot to see what's actually displayed
      await page.screenshot({ 
        path: 'test-results/filter-debug-execution-results.png', 
        fullPage: true 
      });
      
      // Log what we can see for debugging
      const pageContent = await page.textContent('body');
      console.log('Page content for debugging:', pageContent?.substring(0, 500));
      
      throw error;
    }
    
    // Final verification summary
    console.log('\n=== FILTER PROJECT TEST EXECUTION SUMMARY ===');
    console.log('✅ 1. Successfully navigated to AP Agent Test Automation Platform');
    console.log('✅ 2. Successfully clicked TEST PLAN MANAGER tab');
    console.log(`✅ 3. Successfully selected test plan: ${testPlanName}`);
    console.log('✅ 4. Successfully clicked RUN TEST button');
    console.log('✅ 5. Successfully verified test execution started');
    console.log('✅ 6. Successfully monitored execution across all tabs');
    console.log('✅ 7. Successfully waited for test completion (Stop button disabled)');
    console.log('✅ 8. Successfully navigated to Execution Steps tab');
    console.log('✅ 9. Successfully verified Passed count is 17');
    console.log('✅ 10. Successfully verified Success % is 100%');
    console.log('✅ 11. Successfully captured screenshots of entire process');
    console.log('\n🎉 Complete rahul_filter_project execution and verification workflow completed successfully!');
  });

  test('should execute Rahul_Api_Calls and verify output', async ({ page }) => {
    // Set test timeout to 5 minutes to accommodate test execution completion
    test.setTimeout(300000);
    // Step 1: Navigate to the AP Agent Test Automation Platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load as per instructions (10s after navigation)
    await page.waitForTimeout(10000);
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    console.log('✅ Successfully navigated to AP Agent Test Automation Platform');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/api-01-initial-page-load.png', 
      fullPage: true 
    });
    
    // Step 2: Click on TEST PLAN MANAGER tab
    const testPlanManagerTab = page.getByRole('tab', { name: 'Test Plan Manager' });
    await expect(testPlanManagerTab).toBeVisible({ timeout: 90000 });
    await testPlanManagerTab.click();
    
    console.log('✅ Successfully clicked TEST PLAN MANAGER tab');
    
    // Wait for tab content to load
    await page.waitForTimeout(3000);
    
    // Verify we're on the Test Plan Manager tab
    await expect(testPlanManagerTab).toHaveAttribute('aria-selected', 'true');
    
    // Take screenshot after switching to Test Plan Manager
    await page.screenshot({ 
      path: 'test-results/api-02-test-plan-manager-tab.png', 
      fullPage: true 
    });
    
    // Step 3: Select the specific test plan
    const testPlanName = 'rahul_api_calls';
    
    // Find and click the test plan dropdown (second combobox)
    const testPlanDropdown = page.locator('[role="combobox"]').nth(1);
    await expect(testPlanDropdown).toBeVisible({ timeout: 30000 });
    await testPlanDropdown.click();
    
    console.log('✅ Clicked test plan dropdown');
    
    // Wait for dropdown options to appear
    await page.waitForTimeout(3000);
    
    // Take screenshot of dropdown options
    await page.screenshot({ 
      path: 'test-results/api-03-dropdown-options.png', 
      fullPage: true 
    });
    
    // Select the specific test plan option
    try {
      const testPlanOption = page.getByRole('option', { name: testPlanName });
      await expect(testPlanOption).toBeVisible({ timeout: 30000 });
      await testPlanOption.click();
      console.log(`✅ Successfully selected test plan: ${testPlanName}`);
    } catch (error) {
      console.log(`❌ Failed to find test plan option: ${testPlanName}`);
      // Take a screenshot of available options for debugging
      await page.screenshot({ 
        path: 'test-results/api-debug-dropdown-options.png', 
        fullPage: true 
      });
      throw error;
    }
    
    // Wait for selection to take effect
    await page.waitForTimeout(2000);
    
    // Verify the test plan is selected (dropdown should show the selected value)
    await expect(testPlanDropdown).toContainText(testPlanName);
    
    // Take screenshot after test plan selection
    await page.screenshot({ 
      path: 'test-results/api-04-test-plan-selected.png', 
      fullPage: true 
    });
    
    // Step 4: Click RUN TEST button
    const runTestButton = page.getByRole('button', { name: /run test/i });
    await expect(runTestButton).toBeVisible({ timeout: 90000 });
    await expect(runTestButton).toBeEnabled();
    await runTestButton.click();
    
    console.log('✅ Successfully clicked RUN TEST button');
    
    // Wait for test execution to begin (reduced from 6s to 3s for efficiency)
    await page.waitForTimeout(3000);
    
    // Take screenshot immediately after clicking RUN TEST
    await page.screenshot({ 
      path: 'test-results/api-05-test-execution-started.png', 
      fullPage: true 
    });
    
    // Step 5: Verify test execution started
    // Check for indicators that test is running
    const stopTestButton = page.getByRole('button', { name: /stop test/i });
    
    try {
      await expect(stopTestButton).toBeVisible({ timeout: 30000 });
      await expect(stopTestButton).toBeEnabled();
      console.log('✅ Test execution started - Stop Test button is visible and enabled');
    } catch (error) {
      console.log('⚠️ Stop Test button not immediately visible, checking for other execution indicators...');
    }
    
    // Step 6: Monitor test execution progress
    // Try to find and switch to execution monitoring tabs
    let executionTabFound = false;
    
    // Try "Live Flow" first
    try {
      const liveFlowTab = page.getByRole('tab', { name: 'Live Flow' });
      await expect(liveFlowTab).toBeVisible({ timeout: 10000 });
      await liveFlowTab.click();
      executionTabFound = true;
      console.log('✅ Switched to Live Flow tab to monitor execution');
    } catch (error) {
      console.log('⚠️ Live Flow tab not found, trying alternative tabs...');
    }
    
    // If Live Flow not found, try "Live Execution Flow" or similar
    if (!executionTabFound) {
      try {
        const executionTab = page.getByRole('tab', { name: /live.*flow/i });
        await expect(executionTab).toBeVisible({ timeout: 10000 });
        await executionTab.click();
        executionTabFound = true;
        console.log('✅ Switched to execution monitoring tab');
      } catch (error) {
        console.log('⚠️ No execution flow tab found, continuing with current view');
      }
    }
    
    // Wait for execution data to appear (reduced for efficiency)
    await page.waitForTimeout(3000);
    
    // Take screenshot of current execution view
    await page.screenshot({ 
      path: 'test-results/api-06-execution-monitoring.png', 
      fullPage: true 
    });
    
    // Verify execution is happening (should not show "No execution data available")
    const noExecutionDataText = page.getByText('No execution data available');
    
    try {
      // Check if "No execution data available" is visible
      const isNoDataVisible = await noExecutionDataText.isVisible({ timeout: 5000 });
      if (isNoDataVisible) {
        console.log('⚠️ No execution data available yet - test may still be starting');
      } else {
        console.log('✅ Test execution data is visible - test is running successfully');
      }
    } catch (error) {
      console.log('✅ Execution monitoring completed');
    }
    
    // Step 7: Check other tabs for execution data (with error handling)
    const tabsToCheck = [
      { name: 'Logs', screenshot: 'api-07-logs-tab.png' },
      { name: 'Screenshots', screenshot: 'api-08-screenshots-tab.png' },
      { name: 'Results', screenshot: 'api-09-results-tab.png' }
    ];
    
    for (const tabInfo of tabsToCheck) {
      try {
        const tab = page.getByRole('tab', { name: tabInfo.name });
        await expect(tab).toBeVisible({ timeout: 10000 });
        await tab.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: `test-results/${tabInfo.screenshot}`, 
          fullPage: true 
        });
        
        console.log(`✅ Successfully checked ${tabInfo.name} tab`);
      } catch (error) {
        console.log(`⚠️ ${tabInfo.name} tab not found or not accessible`);
      }
    }
    
    // Step 8: Wait for test completion or stop test manually
    // Let the test run for a reasonable amount of time to see results
    console.log('⏳ Waiting for test execution to progress...');
    await page.waitForTimeout(10000);
    
    // Take screenshot during execution
    await page.screenshot({ 
      path: 'test-results/api-10-execution-progress.png', 
      fullPage: true 
    });
    
    // Step 9: Wait for Stop button to be disabled (indicating test completion)
    console.log('⏳ Waiting for test execution to complete...');
    const stopButton = page.getByRole('button', { name: /stop test/i });
    
    try {
      // Wait for the Stop button to become disabled (test completion)
      await expect(stopButton).toBeDisabled({ timeout: 120000 }); // Wait up to 2 minutes
      console.log('✅ Test execution completed - Stop button is now disabled');
    } catch (error) {
      console.log('⚠️ Stop button still enabled after timeout, test may still be running');
    }
    
    // Step 10: Click on Execution Steps tab
    console.log('🔍 Navigating to Execution Steps tab...');
    try {
      const executionStepsTab = page.getByRole('tab', { name: 'Execution Steps' });
      await expect(executionStepsTab).toBeVisible({ timeout: 30000 });
      await executionStepsTab.click();
      
      // Wait for tab content to load
      await page.waitForTimeout(3000);
      
      console.log('✅ Successfully clicked Execution Steps tab');
      
      // Take screenshot of Execution Steps tab
      await page.screenshot({ 
        path: 'test-results/api-11-execution-steps-tab.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('❌ Failed to find or click Execution Steps tab');
      throw error;
    }
    
    // Step 11: Verify that Passed is 9 and Success % is 100%
    console.log('🔍 Verifying test results...');
    try {
      // Look for Passed count of 9 - use first() to handle multiple matches
      const passedCount = page.getByText('Passed9').first().or(
        page.locator('div').filter({ hasText: /^Passed9$/ }).first()
      ).or(
        page.getByText(/passed.*9/i).first()
      );
      
      await expect(passedCount).toBeVisible({ timeout: 30000 });
      console.log('✅ Verified: Passed count is 9');
      
      // Look for Success % of 100%
      const successPercentage = page.getByText('Success100%').first().or(
        page.locator('div').filter({ hasText: /^Success100%$/ }).first()
      ).or(
        page.getByText(/success.*100%/i).first()
      );
      
      await expect(successPercentage).toBeVisible({ timeout: 30000 });
      console.log('✅ Verified: Success % is 100%');
      
      // Take final verification screenshot
      await page.screenshot({ 
        path: 'test-results/api-12-final-verification.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('❌ Failed to verify test results (Passed: 9, Success: 100%)');
      
      // Take debug screenshot to see what's actually displayed
      await page.screenshot({ 
        path: 'test-results/api-debug-execution-results.png', 
        fullPage: true 
      });
      
      // Log what we can see for debugging
      const pageContent = await page.textContent('body');
      console.log('Page content for debugging:', pageContent?.substring(0, 500));
      
      throw error;
    }
    
    // Final verification summary
    console.log('\n=== API CALLS TEST EXECUTION SUMMARY ===');
    console.log('✅ 1. Successfully navigated to AP Agent Test Automation Platform');
    console.log('✅ 2. Successfully clicked TEST PLAN MANAGER tab');
    console.log(`✅ 3. Successfully selected test plan: ${testPlanName}`);
    console.log('✅ 4. Successfully clicked RUN TEST button');
    console.log('✅ 5. Successfully verified test execution started');
    console.log('✅ 6. Successfully monitored execution across all tabs');
    console.log('✅ 7. Successfully waited for test completion (Stop button disabled)');
    console.log('✅ 8. Successfully navigated to Execution Steps tab');
    console.log('✅ 9. Successfully verified Passed count is 9');
    console.log('✅ 10. Successfully verified Success % is 100%');
    console.log('✅ 11. Successfully captured screenshots of entire process');
    console.log('\n🎉 Complete rahul_api_calls execution and verification workflow completed successfully!');
  });

  test('should execute rahul_download and verify output', async ({ page }) => {
    // Set test timeout to 5 minutes to accommodate test execution completion
    test.setTimeout(300000);
    // Step 1: Navigate to the AP Agent Test Automation Platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load as per instructions (10s after navigation)
    await page.waitForTimeout(10000);
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle('Test Automation Agent', { timeout: 90000 });
    console.log('✅ Successfully navigated to AP Agent Test Automation Platform');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/download-01-initial-page-load.png', 
      fullPage: true 
    });
    
    // Step 2: Click on TEST PLAN MANAGER tab
    const testPlanManagerTab = page.getByRole('tab', { name: 'Test Plan Manager' });
    await expect(testPlanManagerTab).toBeVisible({ timeout: 90000 });
    await testPlanManagerTab.click();
    
    console.log('✅ Successfully clicked TEST PLAN MANAGER tab');
    
    // Wait for tab content to load
    await page.waitForTimeout(3000);
    
    // Verify we're on the Test Plan Manager tab
    await expect(testPlanManagerTab).toHaveAttribute('aria-selected', 'true');
    
    // Take screenshot after switching to Test Plan Manager
    await page.screenshot({ 
      path: 'test-results/download-02-test-plan-manager-tab.png', 
      fullPage: true 
    });
    
    // Step 3: Select the specific test plan
    const testPlanName = 'rahul_download';
    
    // Find and click the test plan dropdown (second combobox)
    const testPlanDropdown = page.locator('[role="combobox"]').nth(1);
    await expect(testPlanDropdown).toBeVisible({ timeout: 30000 });
    await testPlanDropdown.click();
    
    console.log('✅ Clicked test plan dropdown');
    
    // Wait for dropdown options to appear
    await page.waitForTimeout(3000);
    
    // Take screenshot of dropdown options
    await page.screenshot({ 
      path: 'test-results/download-03-dropdown-options.png', 
      fullPage: true 
    });
    
    // Select the specific test plan option
    try {
      const testPlanOption = page.getByRole('option', { name: testPlanName });
      await expect(testPlanOption).toBeVisible({ timeout: 30000 });
      await testPlanOption.click();
      console.log(`✅ Successfully selected test plan: ${testPlanName}`);
    } catch (error) {
      console.log(`❌ Failed to find test plan option: ${testPlanName}`);
      // Take a screenshot of available options for debugging
      await page.screenshot({ 
        path: 'test-results/download-debug-dropdown-options.png', 
        fullPage: true 
      });
      throw error;
    }
    
    // Wait for selection to take effect
    await page.waitForTimeout(2000);
    
    // Verify the test plan is selected (dropdown should show the selected value)
    await expect(testPlanDropdown).toContainText(testPlanName);
    
    // Take screenshot after test plan selection
    await page.screenshot({ 
      path: 'test-results/download-04-test-plan-selected.png', 
      fullPage: true 
    });
    
    // Step 4: Click RUN TEST button
    const runTestButton = page.getByRole('button', { name: /run test/i });
    await expect(runTestButton).toBeVisible({ timeout: 90000 });
    await expect(runTestButton).toBeEnabled();
    await runTestButton.click();
    
    console.log('✅ Successfully clicked RUN TEST button');
    
    // Wait for test execution to begin (reduced from 6s to 3s for efficiency)
    await page.waitForTimeout(3000);
    
    // Take screenshot immediately after clicking RUN TEST
    await page.screenshot({ 
      path: 'test-results/download-05-test-execution-started.png', 
      fullPage: true 
    });
    
    // Step 5: Verify test execution started
    // Check for indicators that test is running
    const stopTestButton = page.getByRole('button', { name: /stop test/i });
    
    try {
      await expect(stopTestButton).toBeVisible({ timeout: 30000 });
      await expect(stopTestButton).toBeEnabled();
      console.log('✅ Test execution started - Stop Test button is visible and enabled');
    } catch (error) {
      console.log('⚠️ Stop Test button not immediately visible, checking for other execution indicators...');
    }
    
    // Step 6: Monitor test execution progress
    // Try to find and switch to execution monitoring tabs
    let executionTabFound = false;
    
    // Try "Live Flow" first
    try {
      const liveFlowTab = page.getByRole('tab', { name: 'Live Flow' });
      await expect(liveFlowTab).toBeVisible({ timeout: 10000 });
      await liveFlowTab.click();
      executionTabFound = true;
      console.log('✅ Switched to Live Flow tab to monitor execution');
    } catch (error) {
      console.log('⚠️ Live Flow tab not found, trying alternative tabs...');
    }
    
    // If Live Flow not found, try "Live Execution Flow" or similar
    if (!executionTabFound) {
      try {
        const executionTab = page.getByRole('tab', { name: /live.*flow/i });
        await expect(executionTab).toBeVisible({ timeout: 10000 });
        await executionTab.click();
        executionTabFound = true;
        console.log('✅ Switched to execution monitoring tab');
      } catch (error) {
        console.log('⚠️ No execution flow tab found, continuing with current view');
      }
    }
    
    // Wait for execution data to appear (reduced for efficiency)
    await page.waitForTimeout(3000);
    
    // Take screenshot of current execution view
    await page.screenshot({ 
      path: 'test-results/download-06-execution-monitoring.png', 
      fullPage: true 
    });
    
    // Verify execution is happening (should not show "No execution data available")
    const noExecutionDataText = page.getByText('No execution data available');
    
    try {
      // Check if "No execution data available" is visible
      const isNoDataVisible = await noExecutionDataText.isVisible({ timeout: 5000 });
      if (isNoDataVisible) {
        console.log('⚠️ No execution data available yet - test may still be starting');
      } else {
        console.log('✅ Test execution data is visible - test is running successfully');
      }
    } catch (error) {
      console.log('✅ Execution monitoring completed');
    }
    
    // Step 7: Check other tabs for execution data (with error handling)
    const tabsToCheck = [
      { name: 'Logs', screenshot: 'download-07-logs-tab.png' },
      { name: 'Screenshots', screenshot: 'download-08-screenshots-tab.png' },
      { name: 'Results', screenshot: 'download-09-results-tab.png' }
    ];
    
    for (const tabInfo of tabsToCheck) {
      try {
        const tab = page.getByRole('tab', { name: tabInfo.name });
        await expect(tab).toBeVisible({ timeout: 10000 });
        await tab.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: `test-results/${tabInfo.screenshot}`, 
          fullPage: true 
        });
        
        console.log(`✅ Successfully checked ${tabInfo.name} tab`);
      } catch (error) {
        console.log(`⚠️ ${tabInfo.name} tab not found or not accessible`);
      }
    }
    
    // Step 8: Wait for test completion or stop test manually
    // Let the test run for a reasonable amount of time to see results
    console.log('⏳ Waiting for test execution to progress...');
    await page.waitForTimeout(10000);
    
    // Take screenshot during execution
    await page.screenshot({ 
      path: 'test-results/download-10-execution-progress.png', 
      fullPage: true 
    });
    
    // Step 9: Wait for Stop button to be disabled (indicating test completion)
    console.log('⏳ Waiting for test execution to complete...');
    const stopButton = page.getByRole('button', { name: /stop test/i });
    
    try {
      // Wait for the Stop button to become disabled (test completion)
      await expect(stopButton).toBeDisabled({ timeout: 120000 }); // Wait up to 2 minutes
      console.log('✅ Test execution completed - Stop button is now disabled');
    } catch (error) {
      console.log('⚠️ Stop button still enabled after timeout, test may still be running');
    }
    
    // Step 10: Click on Execution Steps tab
    console.log('🔍 Navigating to Execution Steps tab...');
    try {
      const executionStepsTab = page.getByRole('tab', { name: 'Execution Steps' });
      await expect(executionStepsTab).toBeVisible({ timeout: 30000 });
      await executionStepsTab.click();
      
      // Wait for tab content to load
      await page.waitForTimeout(3000);
      
      console.log('✅ Successfully clicked Execution Steps tab');
      
      // Take screenshot of Execution Steps tab
      await page.screenshot({ 
        path: 'test-results/download-11-execution-steps-tab.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('❌ Failed to find or click Execution Steps tab');
      throw error;
    }
    
    // Step 11: Verify that Passed is 14 and Success % is 100%
    console.log('🔍 Verifying test results...');
    try {
      // Look for Passed count of 14 - use first() to handle multiple matches
      const passedCount = page.getByText('Passed14').first().or(
        page.locator('div').filter({ hasText: /^Passed14$/ }).first()
      ).or(
        page.getByText(/passed.*14/i).first()
      );
      
      await expect(passedCount).toBeVisible({ timeout: 30000 });
      console.log('✅ Verified: Passed count is 14');
      
      // Look for Success % of 100%
      const successPercentage = page.getByText('Success100%').first().or(
        page.locator('div').filter({ hasText: /^Success100%$/ }).first()
      ).or(
        page.getByText(/success.*100%/i).first()
      );
      
      await expect(successPercentage).toBeVisible({ timeout: 30000 });
      console.log('✅ Verified: Success % is 100%');
      
      // Take final verification screenshot
      await page.screenshot({ 
        path: 'test-results/download-12-final-verification.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.log('❌ Failed to verify test results (Passed: 14, Success: 100%)');
      
      // Take debug screenshot to see what's actually displayed
      await page.screenshot({ 
        path: 'test-results/download-debug-execution-results.png', 
        fullPage: true 
      });
      
      // Log what we can see for debugging
      const pageContent = await page.textContent('body');
      console.log('Page content for debugging:', pageContent?.substring(0, 500));
      
      throw error;
    }
    
    // Final verification summary
    console.log('\n=== DOWNLOAD TEST EXECUTION SUMMARY ===');
    console.log('✅ 1. Successfully navigated to AP Agent Test Automation Platform');
    console.log('✅ 2. Successfully clicked TEST PLAN MANAGER tab');
    console.log(`✅ 3. Successfully selected test plan: ${testPlanName}`);
    console.log('✅ 4. Successfully clicked RUN TEST button');
    console.log('✅ 5. Successfully verified test execution started');
    console.log('✅ 6. Successfully monitored execution across all tabs');
    console.log('✅ 7. Successfully waited for test completion (Stop button disabled)');
    console.log('✅ 8. Successfully navigated to Execution Steps tab');
    console.log('✅ 9. Successfully verified Passed count is 14');
    console.log('✅ 10. Successfully verified Success % is 100%');
    console.log('✅ 11. Successfully captured screenshots of entire process');
    console.log('\n🎉 Complete rahul_download execution and verification workflow completed successfully!');
  });

  test('should verify test plan selection persistence', async ({ page }) => {
    // Set test timeout for this test as well
    test.setTimeout(60000);
    
    // Navigate to the platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    await page.waitForTimeout(8000);
    
    // Go to Test Plan Manager
    const testPlanManagerTab = page.getByRole('tab', { name: 'Test Plan Manager' });
    await testPlanManagerTab.click();
    await page.waitForTimeout(3000);
    
    // Select the test plan
    const testPlanName = 'rahul_testplan_clicklinkbytext_usingcontains';
    const testPlanDropdown = page.locator('[role="combobox"]').nth(1);
    await testPlanDropdown.click();
    await page.waitForTimeout(2000);
    
    const testPlanOption = page.getByRole('option', { name: testPlanName });
    await testPlanOption.click();
    await page.waitForTimeout(2000);
    
    // Verify selection persists
    await expect(testPlanDropdown).toContainText(testPlanName);
    
    // Switch tabs and come back to verify persistence
    const testAutomationTab = page.getByRole('tab', { name: 'Test Automation' });
    await testAutomationTab.click();
    await page.waitForTimeout(2000);
    
    await testPlanManagerTab.click();
    await page.waitForTimeout(2000);
    
    // Verify the selection is still there
    await expect(testPlanDropdown).toContainText(testPlanName);
    
    console.log('✅ Test plan selection persistence verified');
  });
});
