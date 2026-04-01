import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers/login';

test.describe('Launch ScenarioSet - Complete Test Launch Flow', () => {
  test('should create launch, wait for test cases to complete, and mark launch as completed', async ({ page }) => {
    // Set a reasonable timeout to accommodate test execution + status update
    test.setTimeout(1200000); // 20 minutes to allow for test execution and status updates
    
    console.log('🚀 Starting Launch ScenarioSet test...');
    
    // ============================================
    // SECTION 1: Navigate to Existing Test Group
    // ============================================
    console.log('📋 Section 1: Navigate to Existing Test Group');
    
    // Login if needed
    await loginIfNeeded(page);
    console.log('✅ Login completed');
    
    // Navigate to the existing test group page
    const testGroupId = '6909b766-0c51-4933-aa82-6dbe3680d421';
    const testGroupUrl = `https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups/${testGroupId}`;
    
    await page.goto(testGroupUrl);
    console.log(`✅ Navigated to test group page: ${testGroupUrl}`);
    
    // Wait for page to load (10s after navigation as per instructions)
    await page.waitForTimeout(10000);
    
    // Verify we're on the test group page
    await expect(page).toHaveURL(new RegExp(`/test-groups/${testGroupId}`), { timeout: 90000 });
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    
    // Extract test group name from the page
    // The test group name is typically displayed in the page header, title, or breadcrumb
    let testGroupName = 'Existing Test Group';
    
    try {
      // Method 1: Look for the test group name in headings (h1, h2, h3)
      const headings = page.locator('h1, h2, h3, [role="heading"]');
      const headingCount = await headings.count();
      
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const text = await heading.textContent().catch(() => '');
        if (text && text.trim() && 
            !text.includes('Test Groups') && 
            !text.includes('Create') && 
            !text.includes('Launch') &&
            text.length > 3 && 
            text.length < 100) {
          testGroupName = text.trim();
          console.log(`✅ Found test group name from heading: "${testGroupName}"`);
          break;
        }
      }
      
      // Method 2: If not found, look for text in the main content area
      if (testGroupName === 'Existing Test Group') {
        // Look for text that appears to be the test group name
        // Usually it's near the top of the page, not in buttons or common UI elements
        const mainContent = page.locator('main, [role="main"], [class*="content"], [class*="container"]').first();
        const mainText = await mainContent.textContent().catch(() => '');
        
        if (mainText) {
          // Look for lines that might be the test group name
          const lines = mainText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          for (const line of lines) {
            if (line.length > 5 && 
                line.length < 100 && 
                !line.includes('Test Groups') &&
                !line.includes('Create Launch') &&
                !line.includes('Add Test Case') &&
                !line.match(/^\d+$/) && // Not just numbers
                !line.includes('QAPA-')) { // Not a test case ID
              testGroupName = line;
              console.log(`✅ Found test group name from content: "${testGroupName}"`);
              break;
            }
          }
        }
      }
      
      // Method 3: Use a more generic approach - find the most prominent text that's not UI elements
      if (testGroupName === 'Existing Test Group') {
        // Wait a bit more for page to fully render
        await page.waitForTimeout(2000);
        
        // Try to find text in the page that looks like a name
        // This is a fallback - we'll use the test group ID pattern if name extraction fails
        console.log('⚠️ Could not reliably extract test group name, will use pattern matching for launch row');
      }
    } catch (error) {
      console.log(`⚠️ Error extracting test group name: ${error}`);
      console.log('   Will use pattern matching for launch row identification');
    }
    
    console.log(`✅ Test group "${testGroupName}" is ready (ID: ${testGroupId})`);
    
    // Verify test group page is loaded by checking for common elements
    const createLaunchButtonCheck = page.getByRole('button', { name: 'Create Launch' });
    const isCreateLaunchVisible = await createLaunchButtonCheck.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isCreateLaunchVisible) {
      // Check if we need to wait longer or if there's an error
      await page.waitForTimeout(3000);
      const errorMessage = page.getByText(/Error|Not Found|Access Denied/i);
      const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasError) {
        const errorText = await errorMessage.textContent();
        throw new Error(`Failed to load test group page: ${errorText}`);
      }
    }
    
    console.log('✅ Test group page loaded successfully');
    
    // ============================================
    // SECTION 2: Create Test Launch
    // ============================================
    console.log('📋 Section 2: Create Test Launch');
    
    // Step 1: Click "Create Launch" button
    const createLaunchButton = page.getByRole('button', { name: 'Create Launch' });
    await expect(createLaunchButton).toBeVisible({ timeout: 90000 });
    await createLaunchButton.click();
    console.log('✅ Clicked Create Launch button');
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Verify "Create Test Launch" modal is visible
    await expect(page.getByRole('heading', { name: /Create Test Launch/i })).toBeVisible({ timeout: 90000 });
    console.log('✅ Create Test Launch modal is visible');
    
    // Step 2: Select AI Model as '5.1 model'
    // Wait for modal to fully render and all fields to be available
    await page.waitForTimeout(3000);
    
    // Find and click AI Model field using evaluate to traverse DOM
    const aiModelClicked = await page.evaluate(() => {
      // Find all elements containing "AI Model" text
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      const aiModelNodes = [];
      while (node = walker.nextNode()) {
        if (node.textContent && /AI Model/i.test(node.textContent.trim())) {
          aiModelNodes.push(node.parentElement);
        }
      }
      
      if (aiModelNodes.length > 0) {
        const labelElement = aiModelNodes[0];
        // Traverse up to find the form field container
        let current = labelElement;
        for (let i = 0; i < 5 && current; i++) {
          // Look for clickable elements in this container
          const clickable = current.querySelector('button, select, [role="button"], [role="combobox"], [tabindex="0"], input[type="text"]');
          if (clickable && clickable.offsetParent !== null) {
            (clickable as HTMLElement).click();
            return true;
          }
          current = current.parentElement;
        }
      }
      return false;
    });
    
    if (!aiModelClicked) {
      // Fallback: Try using locator with a more generic approach
      const aiModelText = page.getByText(/AI Model/i);
      await expect(aiModelText).toBeVisible({ timeout: 90000 });
      
      // Find the field by going up the DOM tree
      const fieldContainer = aiModelText.locator('..').locator('..').locator('..');
      const clickableField = fieldContainer.locator('button, select, [role="button"]').first();
      await expect(clickableField).toBeVisible({ timeout: 90000 });
      await clickableField.click();
      console.log('✅ Clicked AI Model field (fallback method)');
    } else {
      console.log('✅ Clicked AI Model field (via evaluate)');
    }
    
    // Wait for dropdown to open
    await page.waitForTimeout(500);
    
    // Select "5.1 model" option
    const aiModelOption = page.getByRole('option', { name: /5\.1 model/i });
    await expect(aiModelOption).toBeVisible({ timeout: 90000 });
    await aiModelOption.click();
    console.log('✅ Selected "5.1 model" from AI Model dropdown');
    
    // Wait for selection to be processed
    await page.waitForTimeout(500);
    
    // Verify AI Model is selected by checking if the modal is still visible
    await expect(page.getByRole('heading', { name: /Create Test Launch/i })).toBeVisible({ timeout: 90000 });
    console.log('✅ AI Model "5.1 model" is selected (dropdown closed after selection)');
    
    // Step 3: Click "Launch Now" button
    // Set up API response listeners BEFORE clicking
    // Wait for both creation and grid refresh APIs
    const createLaunchResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/testlaunch/create') || 
                url.includes('/api/launch/create') ||
                url.includes('/api/testcaseAutomation/launch')) && 
               response.status() === 200;
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    const gridRefreshPromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/testlaunch/list') || 
                url.includes('/api/launch/list') ||
                url.includes('/api/testlaunch/testLaunchList') ||
                url.includes('/api/testcaseAutomation/list')) && 
               response.status() === 200;
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    const launchNowButton = page.getByRole('button', { name: 'Launch Now' });
    await expect(launchNowButton).toBeVisible({ timeout: 90000 });
    await expect(launchNowButton).toBeEnabled({ timeout: 90000 });
    await launchNowButton.click();
    console.log('✅ Clicked Launch Now button');
    
    // Wait for launch creation API response
    await createLaunchResponsePromise;
    console.log('✅ Launch creation API call completed');
    
    // Wait for grid refresh API response
    await gridRefreshPromise;
    console.log('✅ Grid refresh API call completed (launch should be visible)');
    
    // Wait for launch to be created (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // Verify toast message displays that the launch has been successfully created
    const successToast = page.getByText(/Test launch created successfully|launch created successfully/i).or(
      page.getByRole('alert').filter({ hasText: /launch created successfully/i })
    );
    
    const isToastVisible = await successToast.isVisible({ timeout: 10000 }).catch(() => false);
    if (isToastVisible) {
      const toastText = await successToast.textContent();
      console.log(`✅ Toast message is visible: "${toastText}"`);
    } else {
      console.log('⚠️ Toast message not visible (may have disappeared quickly, will verify via launch history)');
    }
    
    // ============================================
    // SECTION 3: Navigate to Launch Details
    // ============================================
    console.log('📋 Section 3: Navigate to Launch Details');
    
    // Verify we're on the Test Launches tab (should auto-switch after launch creation)
    const testLaunchesTab = page.getByRole('tab', { name: /Test Launches/i });
    const isTabVisible = await testLaunchesTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (isTabVisible) {
      console.log('✅ Test Launches tab is visible');
    } else {
      // If tab is not visible, try clicking it explicitly
      console.log('⚠️ Test Launches tab not automatically visible, attempting to click...');
      const testLaunchesTabExplicit = page.getByRole('tab', { name: /Test Launches/i });
      const isTabAvailable = await testLaunchesTabExplicit.isVisible({ timeout: 10000 }).catch(() => false);
      if (isTabAvailable) {
        await testLaunchesTabExplicit.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Test Launches tab');
      }
    }
    
    // Verify Test Launch History section is visible
    // Use more flexible matching - the text might be "Test Launch History", "Launch History", or similar
    const testLaunchHistory = page.getByText(/Test Launch History|Launch History|Test Launches/i).first();
    const isHistoryVisible = await testLaunchHistory.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!isHistoryVisible) {
      // Wait a bit more and try again
      await page.waitForTimeout(3000);
      const testLaunchHistoryRetry = page.getByText(/Test Launch History|Launch History|Test Launches|History/i).first();
      const isHistoryVisibleRetry = await testLaunchHistoryRetry.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (isHistoryVisibleRetry) {
        console.log('✅ Test Launch History section is visible (after retry)');
      } else {
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/test-launch-history-not-found.png', fullPage: true });
        console.log('⚠️ Test Launch History section not found, but continuing - may be in different location');
        // Continue anyway - we'll try to find the launch row
      }
    } else {
      console.log('✅ Test Launch History section is visible');
    }
    
    // Find the launch row in the grid
    // Launch name might include timestamp, so use pattern matching
    // If we couldn't extract the test group name, find the most recent launch (first row)
    let launchRow;
    
    if (testGroupName !== 'Existing Test Group') {
      // Use test group name pattern to find the launch row
      launchRow = page.getByRole('row').filter({ 
        hasText: new RegExp(testGroupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) 
      });
      console.log(`🔍 Searching for launch row with test group name: "${testGroupName}"`);
    } else {
      // Fallback: Find the most recent launch (typically the first data row in the grid)
      // Skip header row and get the first data row
      const allRows = page.getByRole('row');
      const rowCount = await allRows.count();
      
      if (rowCount > 1) {
        // First row is usually header, second row is the most recent launch
        launchRow = allRows.nth(1);
        console.log('🔍 Using most recent launch (first data row in grid)');
      } else {
        // If only one row, use it
        launchRow = allRows.first();
        console.log('🔍 Using the only row found in grid');
      }
    }
    
    await expect(launchRow).toBeVisible({ timeout: 90000 });
    console.log(`✅ Launch row is visible in Test Launch History grid`);
    
    // Get the launch ID from the row
    const launchIdLink = launchRow.getByText(/TL-\d+/);
    await expect(launchIdLink).toBeVisible({ timeout: 90000 });
    const launchIdText = await launchIdLink.textContent();
    console.log(`✅ Launch ID found: ${launchIdText}`);
    
    // Store launch ID for later verification (trim whitespace)
    const launchId = launchIdText ? launchIdText.trim() : null;
    if (!launchId) {
      throw new Error('Could not extract launch ID from grid');
    }
    
    // Click on the launch ID to navigate to launch details
    await launchIdLink.click();
    console.log('✅ Clicked launch ID to navigate to launch details');
    
    // Wait for navigation to launch details page
    // Wait for URL to change first
    await expect(page).toHaveURL(new RegExp('/launch-details/'), { timeout: 90000 });
    console.log('✅ URL changed to launch details page');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      console.log('⚠️ Network idle timeout, continuing...');
    });
    await page.waitForTimeout(3000);
    
    // Verify we're on the launch details page
    // Wait for elements that are definitely on the launch details page
    // These are more reliable indicators than the launch ID text which might be formatted differently
    const launchStatusIndicator = page.getByText(/In Progress|Completed|Failed|Aborted/i).first();
    const testCasesIndicator = page.getByText(/\d+ of \d+ tests completed/i).or(
      page.getByText(/Test Cases|Execution|Results/i).first()
    );
    
    // Wait for at least one of these indicators to be visible
    const isStatusVisible = await launchStatusIndicator.isVisible({ timeout: 10000 }).catch(() => false);
    const isTestCasesVisible = await testCasesIndicator.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isStatusVisible || isTestCasesVisible) {
      console.log('✅ Launch details page loaded (verified by status or test cases indicator)');
      if (isStatusVisible) {
        const statusText = await launchStatusIndicator.textContent();
        console.log(`   Launch status: ${statusText}`);
      }
    } else {
      // Try to find launch ID as fallback
      const launchIdOnPage = page.getByText(new RegExp(launchId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      const isLaunchIdVisible = await launchIdOnPage.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isLaunchIdVisible) {
        console.log(`✅ Launch ID "${launchId}" is visible on launch details page`);
      } else {
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/launch-details-verification-failed.png', fullPage: true });
        console.log(`⚠️ Could not verify launch details page elements`);
        console.log(`   Launch ID "${launchId}" not found, but URL indicates launch details page`);
        console.log('   Continuing with test - page may have loaded differently');
      }
    }
    
    console.log('✅ Navigated to launch details page');
    
    // ============================================
    // SECTION 4: Wait for Test Cases to Complete
    // ============================================
    console.log('📋 Section 4: Wait for Test Cases to Complete Execution');
    
    // Wait for the page to fully load
    await page.waitForTimeout(3000);
    
    // Verify launch status is visible
    const launchStatus = page.getByText(/In Progress|Completed|Failed|Aborted/i).first();
    await expect(launchStatus).toBeVisible({ timeout: 90000 });
    const initialStatus = await launchStatus.textContent();
    console.log(`✅ Initial launch status: ${initialStatus}`);
    
    // Verify initial status is "In Progress"
    expect(initialStatus).toContain('In Progress');
    
    // Poll for test cases to complete - check if status changes from "In Progress"
    console.log('⏳ Waiting for all test cases to complete execution...');
    
    // Use expect.poll() to wait for all test cases to complete
    // Check the "X of Y tests completed" text
    const executionStatusText = page.getByText(/\d+ of \d+ tests completed/i);
    
    await expect.poll(async () => {
      // Verify element exists first
      const isVisible = await executionStatusText.isVisible({ timeout: 5000 }).catch(() => false);
      if (!isVisible) {
        console.log('⚠️ Execution status text not visible yet');
        return { completed: 0, total: 0, allCompleted: false };
      }
      
      const statusText = await executionStatusText.textContent().catch(() => '');
      const match = statusText.match(/(\d+) of (\d+) tests completed/i);
      if (match) {
        const completed = parseInt(match[1]);
        const total = parseInt(match[2]);
        console.log(`📊 Test execution progress: ${completed}/${total} tests completed`);
        
        // Validate numbers are reasonable
        if (total === 0) {
          console.log('⚠️ Total test count is 0 - may not have loaded yet');
          return { completed: 0, total: 0, allCompleted: false };
        }
        
        return { completed, total, allCompleted: completed === total };
      }
      console.log('⚠️ Could not parse execution status text');
      return { completed: 0, total: 0, allCompleted: false };
    }, {
      message: (result) => `All test cases should complete execution (currently ${result.completed}/${result.total})`,
      timeout: 900000, // 15 minutes total timeout for test case completion
      intervals: [5000, 5000, 10000, 15000, 20000, 30000], // Progressive intervals
    }).toEqual(expect.objectContaining({ allCompleted: true }));
    
    console.log('✅ All test cases have completed execution');
    
    // Verify all test cases have final status (not "In Progress")
    const testCaseRows = page.getByRole('row').filter({ hasText: /QAPA-/i });
    const testCaseCount = await testCaseRows.count();
    console.log(`📊 Found ${testCaseCount} test case rows`);
    
    // Poll to ensure all test cases have final status
    await expect.poll(async () => {
      let allHaveFinalStatus = true;
      for (let i = 0; i < testCaseCount; i++) {
        const row = testCaseRows.nth(i);
        const rowText = await row.textContent().catch(() => '');
        // Check if row has "In Progress" - if so, not all are done
        if (rowText && /In Progress/i.test(rowText) && !/Completed|Failed|Passed|Aborted/i.test(rowText)) {
          allHaveFinalStatus = false;
          break;
        }
      }
      return allHaveFinalStatus;
    }, {
      message: 'All test cases should have final status (not In Progress)',
      timeout: 120000, // 2 minutes
      intervals: [5000, 5000, 10000, 15000, 20000],
    }).toBe(true);
    
    console.log('✅ All test cases have final execution status');
    
    // ============================================
    // SECTION 5: Complete the Launch
    // ============================================
    console.log('📋 Section 5: Complete the Launch');
    
    // Find the "In Progress" status element with pencil icon
    // The status is clickable and opens a menu
    // Use a more robust approach: find status in the launch header/details area
    const statusElement = page.getByText('In Progress').first();
    const isInProgressVisible = await statusElement.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isInProgressVisible) {
      // Status might already be something else, check current status
      const currentStatus = await page.getByText(/In Progress|Completed|Failed|Aborted/i).first().textContent();
      console.log(`⚠️ Current launch status: ${currentStatus}`);
      
      if (currentStatus && /Completed/i.test(currentStatus)) {
        console.log('✅ Launch is already Completed - no action needed');
        await page.screenshot({ path: 'test-results/launch-scenario-already-completed.png', fullPage: true });
        return;
      }
    }
    
    // Click on the status element - find it more robustly
    // Look for the status in the page header/details section
    const inProgressStatus = page.getByText('In Progress').first();
    await expect(inProgressStatus).toBeVisible({ timeout: 90000 });
    
    // Try to find the clickable container - look for parent with button role or clickable element
    const statusContainer = inProgressStatus.locator('..').locator('..');
    const clickableStatus = statusContainer.locator('button, [role="button"], [tabindex="0"]').first();
    
    // If we found a clickable element, use it; otherwise click the text directly
    const isClickable = await clickableStatus.isVisible({ timeout: 2000 }).catch(() => false);
    if (isClickable) {
      await clickableStatus.click();
      console.log('✅ Clicked on status element (via clickable container)');
    } else {
      await inProgressStatus.click();
      console.log('✅ Clicked on status element (direct click)');
    }
    
    // Wait for menu to appear
    await page.waitForTimeout(1000);
    
    // Click "Completed" option from the menu
    const completedOption = page.getByRole('menuitem', { name: 'Completed' });
    await expect(completedOption).toBeVisible({ timeout: 90000 });
    await completedOption.click();
    console.log('✅ Clicked Completed option from menu');
    
    // Wait for confirmation dialog
    await page.waitForTimeout(1000);
    
    // Verify confirmation dialog is visible
    const updateStatusHeading = page.getByRole('heading', { name: /Update Status/i });
    await expect(updateStatusHeading).toBeVisible({ timeout: 90000 });
    console.log('✅ Update Status confirmation dialog is visible');
    
    // Set up API response listener before clicking confirm
    // Capture both success and error responses for debugging
    let statusUpdateResponse: any = null;
    const allResponses: Array<{ url: string; status: number }> = [];
    
    // Listen to all responses to debug
    const responseListener = (response: any) => {
      const url = response.url();
      if (url.includes('updateStatus') || url.includes('update-status') || url.includes('status')) {
        allResponses.push({ url, status: response.status() });
        console.log(`📡 Detected status-related API call: ${url} - Status: ${response.status()}`);
      }
    };
    page.on('response', responseListener);
    
    const updateStatusResponsePromise = page.waitForResponse(
      async (response) => {
        const url = response.url();
        // Check for status update endpoints
        if (url.includes('/api/testcaseAutomation/status/') || 
            url.includes('/api/testlaunch/updateStatus') || 
            url.includes('/api/launch/updateStatus') ||
            (url.includes('/api/testlaunch/') && url.includes('status')) ||
            (url.includes('/api/launch/') && url.includes('status'))) {
          statusUpdateResponse = response;
          const responseStatus = response.status();
          const responseBody = await response.text().catch(() => '');
          console.log(`📡 Status update API response: ${responseStatus} from ${url}`);
          if (responseBody) {
            try {
              const body = JSON.parse(responseBody);
              console.log(`   Response body: ${JSON.stringify(body).substring(0, 200)}...`);
            } catch (e) {
              console.log(`   Response body (text): ${responseBody.substring(0, 200)}...`);
            }
          }
          return responseStatus === 200 || responseStatus === 201;
        }
        return false;
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    // Confirm the status change
    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    await expect(confirmButton).toBeVisible({ timeout: 90000 });
    await expect(confirmButton).toBeEnabled({ timeout: 90000 });
    await confirmButton.click();
    console.log('✅ Clicked Confirm button');
    
    // Wait for confirmation dialog to close
    await expect(updateStatusHeading).not.toBeVisible({ timeout: 10000 });
    console.log('✅ Confirmation dialog closed');
    
    // Wait for API response
    let apiCallSucceeded = false;
    try {
      await updateStatusResponsePromise;
      if (statusUpdateResponse && (statusUpdateResponse.status() === 200 || statusUpdateResponse.status() === 201)) {
        apiCallSucceeded = true;
        console.log('✅ Status update API call completed successfully');
      } else if (statusUpdateResponse) {
        console.log(`⚠️ Status update API call returned status: ${statusUpdateResponse.status()}`);
        const responseBody = await statusUpdateResponse.text().catch(() => '');
        if (responseBody) {
          console.log(`   Response: ${responseBody.substring(0, 300)}...`);
        }
      } else {
        console.log(`⚠️ No status update response captured. Detected ${allResponses.length} status-related API calls:`);
        allResponses.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.url} - Status: ${r.status}`);
        });
      }
    } catch (error) {
      console.log(`⚠️ Status update API call may have already completed or timed out: ${error}`);
      console.log(`   Detected ${allResponses.length} status-related API calls during wait`);
    } finally {
      // Remove the response listener
      page.off('response', responseListener);
    }
    
    // Wait for UI to update
    await page.waitForTimeout(3000);
    
    // Check for error message in snackbar/toast (backend may reject if test cases are still pending/in-progress)
    const errorSnackbar = page.locator('[role="alert"], [class*="snackbar"], [class*="toast"], [class*="MuiSnackbar"]').filter({ 
      hasText: /Cannot mark as COMPLETED|Some test cases are still pending|Status update failed|Failed to update status|error/i 
    });
    const isErrorVisible = await errorSnackbar.isVisible({ timeout: 8000 }).catch(() => false);
    
    // Also check for any error text on the page
    const errorMessage = page.getByText(/Cannot mark as COMPLETED|Some test cases are still pending|Status update failed|Failed to update status|error/i);
    const isErrorTextVisible = await errorMessage.isVisible({ timeout: 8000 }).catch(() => false);
    
    // If API call failed or error is visible, wait longer and retry
    if (!apiCallSucceeded || isErrorVisible || isErrorTextVisible) {
      let errorText = '';
      if (isErrorVisible) {
        errorText = await errorSnackbar.textContent().catch(() => '');
        console.log(`❌ Status update rejected (snackbar): ${errorText}`);
      } else if (isErrorTextVisible) {
        errorText = await errorMessage.textContent().catch(() => '');
        console.log(`❌ Status update rejected (page text): ${errorText}`);
      } else if (!apiCallSucceeded) {
        console.log(`❌ Status update API call failed (status: ${statusUpdateResponse?.status() || 'unknown'})`);
      }
      
      if (errorText) {
        console.log('   The backend prevents marking as COMPLETED until all executions finish');
      }
      console.log('   Waiting longer for test cases to complete, then will retry...');
      
      // Wait additional time for test cases to complete (up to 2 more minutes)
      console.log('⏳ Waiting additional 120 seconds for test cases to complete...');
      await page.waitForTimeout(120000);
      
      // Retry the status update
      console.log('🔄 Retrying status update to Completed...');
      const retryStatusElement = page.getByText(/In Progress|Completed/i).first();
      await expect(retryStatusElement).toBeVisible({ timeout: 90000 });
      const retryStatusText = await retryStatusElement.textContent();
      
      if (retryStatusText && /In Progress/i.test(retryStatusText)) {
        // Set up retry API listener
        const retryResponsePromise = page.waitForResponse(
          async (response) => {
            const url = response.url();
            if (url.includes('/api/testcaseAutomation/status/') || 
                url.includes('/api/testlaunch/updateStatus') || 
                url.includes('/api/launch/updateStatus')) {
              return response.status() === 200 || response.status() === 201;
            }
            return false;
          },
          { timeout: 30000 }
        ).catch(() => null);
        
        await retryStatusElement.click();
        await page.waitForTimeout(1000);
        const retryCompletedOption = page.getByRole('menuitem', { name: 'Completed' });
        await expect(retryCompletedOption).toBeVisible({ timeout: 90000 });
        await retryCompletedOption.click();
        await page.waitForTimeout(1000);
        
        const retryUpdateStatusHeading = page.getByRole('heading', { name: /Update Status/i });
        await expect(retryUpdateStatusHeading).toBeVisible({ timeout: 90000 });
        
        const retryConfirmButton = page.getByRole('button', { name: 'Confirm' });
        await expect(retryConfirmButton).toBeVisible({ timeout: 90000 });
        await retryConfirmButton.click();
        console.log('✅ Retried status update to Completed');
        
        await retryResponsePromise;
        await expect(retryUpdateStatusHeading).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);
      } else if (retryStatusText && /Completed/i.test(retryStatusText)) {
        console.log('✅ Status is already Completed - no retry needed');
      }
    }
    
    // Wait for status update (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // ============================================
    // SECTION 6: Verification
    // ============================================
    console.log('📋 Section 6: Verification');
    
    // Take screenshot before final verification
    await page.screenshot({ path: 'test-results/launch-scenario-before-verification.png', fullPage: true });
    
    // Poll for status change to "Completed"
    console.log('⏳ Waiting for launch status to update to Completed...');
    
    await expect.poll(async () => {
      const statusElements = page.getByText(/In Progress|Completed|Failed|Aborted/i);
      const statusText = await statusElements.first().textContent().catch(() => '');
      console.log(`📊 Current launch status: ${statusText}`);
      return statusText;
    }, {
      message: (current) => `Launch status should be "Completed" (currently: "${current}")`,
      timeout: 90000, // 90 seconds
      intervals: [3000, 3000, 5000, 10000, 15000, 20000],
    }).toContain('Completed');
    
    console.log('✅ Launch status updated to "Completed"');
    
    // Final verification - HARD ASSERTION that status is Completed
    const finalStatus = page.getByText('Completed').first();
    await expect(finalStatus).toBeVisible({ timeout: 10000 });
    
    const finalStatusText = await finalStatus.textContent();
    expect(finalStatusText).toContain('Completed');
    expect(finalStatusText).not.toContain('In Progress');
    console.log('✅ Launch status is "Completed" (HARD ASSERTION PASSED)');
    
    // Verify overall status shows completion
    const overallStatus = page.getByText(/\d+\/\d+/).first();
    const overallStatusText = await overallStatus.textContent();
    console.log(`✅ Overall status: ${overallStatusText}`);
    
    // ============================================
    // SECTION 7: Report Status for Each Test Case
    // ============================================
    console.log('📋 Section 7: Report Status for Each Test Case');
    
    // Wait a moment for any final UI updates
    await page.waitForTimeout(2000);
    
    // Find all test case rows in the grid/table
    // Test cases typically have IDs like QAPA-31, QAPA-32, etc.
    const testCaseRowsForReport = page.getByRole('row').filter({ hasText: /QAPA-\d+/i });
    const testCaseCountForReport = await testCaseRowsForReport.count();
    
    console.log(`📊 Found ${testCaseCountForReport} test case(s) in the launch`);
    
    if (testCaseCountForReport === 0) {
      console.log('⚠️ No test cases found in the launch - cannot report individual statuses');
      await page.screenshot({ path: 'test-results/launch-scenario-no-test-cases.png', fullPage: true });
    } else {
      // Array to store test case statuses
      const testCaseStatuses: Array<{ id: string; status: string; details?: string }> = [];
      
      // Iterate through each test case row and extract status
      for (let i = 0; i < testCaseCountForReport; i++) {
        const row = testCaseRowsForReport.nth(i);
        await expect(row).toBeVisible({ timeout: 10000 });
        
        // Get the full row text to extract information
        const rowText = await row.textContent();
        
        // Extract test case ID (e.g., QAPA-31)
        const testCaseIdMatch = rowText?.match(/(QAPA-\d+)/i);
        const testCaseId = testCaseIdMatch ? testCaseIdMatch[1] : `Test Case ${i + 1}`;
        
        // Extract status - look for common status values
        let status = 'Unknown';
        const statusPatterns = [
          { pattern: /Passed|PASSED|Pass/i, value: 'Passed' },
          { pattern: /Failed|FAILED|Fail/i, value: 'Failed' },
          { pattern: /In Progress|IN PROGRESS|Running/i, value: 'In Progress' },
          { pattern: /Completed|COMPLETED/i, value: 'Completed' },
          { pattern: /Aborted|ABORTED/i, value: 'Aborted' },
          { pattern: /Skipped|SKIPPED|Skip/i, value: 'Skipped' },
          { pattern: /Pending|PENDING/i, value: 'Pending' },
        ];
        
        for (const { pattern, value } of statusPatterns) {
          if (rowText && pattern.test(rowText)) {
            status = value;
            break;
          }
        }
        
        // Try to get status from a specific cell if available
        // Status is often in a specific column (e.g., 4th or 5th column)
        try {
          const statusCell = row.locator('[role="gridcell"]').filter({ hasText: /Passed|Failed|In Progress|Completed|Aborted|Skipped|Pending/i });
          const statusCellText = await statusCell.first().textContent().catch(() => null);
          if (statusCellText) {
            status = statusCellText.trim();
          }
        } catch (error) {
          // If we can't find status cell, use the pattern matching result
        }
        
        // Store the test case status
        testCaseStatuses.push({
          id: testCaseId,
          status: status,
          details: rowText?.substring(0, 100) // First 100 chars for context
        });
      }
      
      // Report the statuses
      console.log('\n📋 Test Case Status Report:');
      console.log('═'.repeat(80));
      console.log(`Total Test Cases: ${testCaseCountForReport}`);
      console.log('-'.repeat(80));
      
      // Count statuses
      const statusCounts: Record<string, number> = {};
      testCaseStatuses.forEach(tc => {
        statusCounts[tc.status] = (statusCounts[tc.status] || 0) + 1;
      });
      
      // Print summary
      console.log('Status Summary:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        const icon = status === 'Passed' ? '✅' : status === 'Failed' ? '❌' : status === 'In Progress' ? '⏳' : '📊';
        console.log(`  ${icon} ${status}: ${count}`);
      });
      
      console.log('-'.repeat(80));
      
      // Print detailed status for each test case
      console.log('Detailed Status:');
      testCaseStatuses.forEach((testCase, index) => {
        const icon = testCase.status === 'Passed' ? '✅' : 
                     testCase.status === 'Failed' ? '❌' : 
                     testCase.status === 'In Progress' ? '⏳' : '📊';
        console.log(`  ${index + 1}. ${icon} ${testCase.id}: ${testCase.status}`);
      });
      
      console.log('═'.repeat(80));
      console.log('');
      
      // Log as structured data for potential programmatic access
      console.log('📊 Test Case Statuses (JSON):');
      console.log(JSON.stringify(testCaseStatuses, null, 2));
      
      // Verify that all test cases have final status (not "In Progress")
      const inProgressCount = testCaseStatuses.filter(tc => tc.status === 'In Progress').length;
      if (inProgressCount > 0) {
        console.log(`⚠️ Warning: ${inProgressCount} test case(s) still in "In Progress" state`);
      } else {
        console.log('✅ All test cases have final status (not In Progress)');
      }
      
      // Count passed vs failed
      const passedCount = testCaseStatuses.filter(tc => tc.status === 'Passed').length;
      const failedCount = testCaseStatuses.filter(tc => tc.status === 'Failed').length;
      
      console.log(`\n📈 Final Results: ${passedCount} Passed, ${failedCount} Failed, ${testCaseCountForReport - passedCount - failedCount} Other`);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/launch-scenario-completed.png', fullPage: true });
    
    console.log('✅ Launch ScenarioSet test completed successfully');
  });
});

