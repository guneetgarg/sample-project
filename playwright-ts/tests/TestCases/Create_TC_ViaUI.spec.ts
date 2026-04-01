import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

test.describe('Create Test Case via UI', () => {
  test('should create a test case with dynamic DateTime description', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(120000);
    
    console.log('🔄 Starting Create Test Case via UI test...');
    
    // Track API requests for analysis
    const apiRequests: Array<{ url: string; method: string; postData?: any; response?: any }> = [];
    
    // Listen for all network requests
    page.on('request', async (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        const method = request.method();
        let postData = null;
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
          try {
            postData = request.postDataJSON();
          } catch {
            postData = request.postData();
          }
        }
        apiRequests.push({ url, method, postData });
        console.log(`📡 API Request: ${method} ${url}`);
        if (postData) {
          console.log(`   Payload: ${JSON.stringify(postData, null, 2)}`);
        }
      }
    });
    
    // Listen for responses
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        const request = apiRequests.find(r => r.url === url && !r.response);
        if (request) {
          try {
            const responseData = await response.json();
            request.response = responseData;
            console.log(`📥 API Response: ${response.status()} ${url}`);
            console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);
          } catch {
            // Response might not be JSON
            const text = await response.text();
            request.response = text;
            console.log(`📥 API Response: ${response.status()} ${url}`);
            console.log(`   Response: ${text.substring(0, 200)}...`);
          }
        }
      }
    });
    
    // ============================================
    // SECTION 1: Login
    // ============================================
    console.log('📋 Section 1: Login');
    
    await login(page);
    console.log('✅ Login completed');
    
    // ============================================
    // SECTION 2: Navigate to Test Cases Page
    // ============================================
    console.log('📋 Section 2: Navigate to Test Cases Page');
    
    const targetUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-cases?moduleId=b4750b1c-1db3-421b-99ba-f8d1230d4be2';
    await page.goto(targetUrl);
    
    // Wait for page to load (10s after navigation as per instructions)
    await page.waitForTimeout(10000);
    
    // Verify we're on the correct page
    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    
    // Verify test cases page content is visible
    await expect(page.getByText(/Test Cases|CreatedbyAutomation/i).first()).toBeVisible({ timeout: 90000 });
    console.log('✅ Navigated to test cases page');
    
    // ============================================
    // SECTION 3: Click Add New Test Case
    // ============================================
    console.log('📋 Section 4: Click Add New Test Case');
    
    // Find the button - try multiple selectors
    let addNewTestCaseButton = page.getByRole('button', { name: 'Add New Test Case' });
    
    // Wait for button to be visible and enabled
    await expect(addNewTestCaseButton).toBeVisible({ timeout: 90000 });
    await expect(addNewTestCaseButton).toBeEnabled({ timeout: 90000 });
    
    // Scroll button into view if needed
    await addNewTestCaseButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Click the button and wait for the labels API call (which happens when drawer opens)
    const labelsResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/labels/getAll') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);
    
    await addNewTestCaseButton.click({ force: true });
    console.log('✅ Clicked Add New Test Case button');
    
    // Wait for labels API to complete (indicates drawer is opening)
    await labelsResponsePromise;
    await page.waitForTimeout(1000); // Wait for drawer animation
    
    // Wait for the drawer to be visible - find the drawer that contains "Create New Test Case" text
    // MUI Drawer has role="presentation", but we need to find the one with our content
    const drawer = page.locator('[role="presentation"]').filter({ hasText: /Create New Test Case/i }).last();
    await expect(drawer).toBeVisible({ timeout: 30000 });
    
    // Verify the drawer content is visible by checking for the text directly
    // The text "Create New Test Case" is in a DIV, not a heading element
    const drawerTitle = drawer.getByText('Create New Test Case');
    await expect(drawerTitle).toBeVisible({ timeout: 30000 });
    console.log('✅ Create New Test Case drawer is visible');
    
    // ============================================
    // SECTION 5: Fill Test Case Form
    // ============================================
    console.log('📋 Section 5: Fill Test Case Form');
    
    // Generate dynamic DateTime for description
    const dynamicDescription = await page.evaluate(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const dateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      return `CreatedbyAuto-${dateTime}`;
    });
    
    console.log(`📝 Generated dynamic description: ${dynamicDescription}`);
    
    // Fill Summary field
    const summaryInput = page.getByRole('textbox', { name: /Enter a clear and concise summary/i });
    await expect(summaryInput).toBeVisible({ timeout: 90000 });
    await summaryInput.fill('TC Created by Automation');
    console.log('✅ Entered Summary: "TC Created by Automation"');
    
    // Wait a moment for the input to be processed
    await page.waitForTimeout(500);
    
    // Fill Description field (rich text editor)
    const descriptionEditor = page.getByRole('textbox', { name: 'rdw-editor' });
    await expect(descriptionEditor).toBeVisible({ timeout: 90000 });
    
    // Click on the editor to focus it
    await descriptionEditor.click();
    await page.waitForTimeout(500);
    
    // Fill the description using fill method
    await descriptionEditor.fill(dynamicDescription);
    console.log(`✅ Entered Description: ${dynamicDescription}`);
    
    // Wait a moment for the input to be processed
    await page.waitForTimeout(500);
    
    // ============================================
    // SECTION 6: Create Test Case
    // ============================================
    console.log('📋 Section 6: Create Test Case');
    
    // Set up listener for test case creation API call
    const createTestCaseResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/testcase/create') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);
    
    // Set up listener for grid refresh API call (happens after creation)
    const gridRefreshResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/testcase/testCaseList') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);
    
    // Verify Create button is enabled
    const createButton = page.getByRole('button', { name: 'Create Test Case' });
    await expect(createButton).toBeVisible({ timeout: 90000 });
    await expect(createButton).toBeEnabled({ timeout: 90000 });
    
    // Click Create button
    await createButton.click();
    console.log('✅ Clicked Create Test Case button');
    
    // Wait for test case creation API to complete
    const createResponse = await createTestCaseResponsePromise;
    if (createResponse) {
      console.log('✅ Test case creation API call completed');
    } else {
      console.log('⚠️ Test case creation API call may have already completed');
    }
    
    // Wait for grid refresh API to complete (ensures count is updated)
    const refreshResponse = await gridRefreshResponsePromise;
    if (refreshResponse) {
      console.log('✅ Grid refresh API call completed (count should be updated)');
    } else {
      console.log('⚠️ Grid refresh API call may have already completed or not triggered yet');
      // Wait a bit more for grid to refresh
      await page.waitForTimeout(2000);
    }
    
    // Verify success message (may appear and disappear quickly)
    const successMessage = page.getByText(/Test case added successfully|added successfully/i);
    const isSuccessVisible = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSuccessVisible) {
      console.log('✅ Success message is visible');
    } else {
      console.log('⚠️ Success message not visible (may have disappeared quickly, continuing...)');
    }
    
    // Wait additional time for UI to update
    await page.waitForTimeout(2000);
    
    // ============================================
    // SECTION 7: Verification
    // ============================================
    console.log('📋 Section 7: Verification');
    
    // Verify modal is closed - check that the drawer with "Create New Test Case" text is not visible
    const drawerAfterClose = page.locator('[role="presentation"]').filter({ hasText: /Create New Test Case/i });
    await expect(drawerAfterClose).not.toBeVisible({ timeout: 10000 });
    console.log('✅ Modal is closed');
    
    // Verify we're still on the test cases page
    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    console.log('✅ Still on test cases page');
    
    // Verify the new test case is visible as the first row
    const firstRow = page.locator('[role="row"]').filter({ hasNot: page.locator('[role="columnheader"]') }).first();
    await expect(firstRow).toBeVisible({ timeout: 90000 });
    
    // Verify the first row contains "TC Created by Automation" in Summary
    const firstRowSummary = firstRow.locator('[role="gridcell"]').nth(2); // Summary is 3rd column (index 2)
    await expect(firstRowSummary).toContainText('TC Created by Automation', { timeout: 90000 });
    console.log('✅ New test case is visible as the first row with correct Summary');
    
    // Verify the test case ID is visible (should be QAPA-XXX format)
    const firstRowTestCaseId = firstRow.locator('[role="gridcell"]').nth(1); // Test Case ID is 2nd column (index 1)
    const testCaseIdText = await firstRowTestCaseId.textContent();
    expect(testCaseIdText).toMatch(/QAPA-\d+/);
    console.log(`✅ Test Case ID: ${testCaseIdText}`);
    
    // ============================================
    // SECTION 8: API Analysis
    // ============================================
    console.log('📋 Section 8: API Analysis');
    console.log('\n📊 API Requests Summary:');
    console.log('='.repeat(80));
    
    // Filter for test case creation API calls
    const testCaseCreationCalls = apiRequests.filter(req => 
      req.url.includes('testcase') || 
      req.url.includes('test-case') ||
      (req.method === 'POST' && req.postData && (
        req.postData.summary || 
        req.postData.testCaseSummary ||
        req.postData.description
      ))
    );
    
    if (testCaseCreationCalls.length > 0) {
      console.log('\n🎯 Test Case Creation API Calls:');
      testCaseCreationCalls.forEach((req, index) => {
        console.log(`\n${index + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`   Payload: ${JSON.stringify(req.postData, null, 2)}`);
        }
        if (req.response) {
          console.log(`   Response: ${JSON.stringify(req.response, null, 2)}`);
        }
      });
    } else {
      console.log('\n⚠️ No test case creation API calls found in the captured requests');
    }
    
    console.log('\n📋 All API Requests:');
    apiRequests.forEach((req, index) => {
      console.log(`\n${index + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`   Payload: ${JSON.stringify(req.postData, null, 2)}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    console.log('✅ Create Test Case via UI test completed successfully');
  });
});

