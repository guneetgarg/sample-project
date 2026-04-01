import { test, expect } from '@playwright/test';
import { loginViaAPI, getCsrfToken, getAuthHeaders } from '../helpers/api/login';
import { setProjectViaAPI } from '../helpers/api/setProject';
import { createTestCaseViaAPI } from '../helpers/api/createTestCase';
import { authTokenFromPage } from '../helpers/api/authTokenFromPage';

test.describe('Create Test Case via API', () => {
  test('should create a test case using API helper functions', async ({ page, request }) => {
    test.setTimeout(120000);

    console.log('🔄 Starting Create Test Case via API test...');

    // ============================================
    // SECTION 1: Login via API
    // ============================================
    console.log('📋 Section 1: Login via API');

    // Login via API to get authentication token and user ID
    const { authToken, requestContext: apiRequestContext, userId } = await loginViaAPI(request);
    console.log('✅ Login completed via API');
    console.log(`   Token: ${authToken.token.substring(0, 20)}...`);
    console.log(`   User ID: ${userId}`);

    // Establish browser session by navigating and setting cookies
    // This is needed because APIRequestContext doesn't persist cookies automatically
    await page.goto('https://qa-path.com/login');
    await page.waitForTimeout(2000);
    
    // Set the token cookie in the browser context
    await page.context().addCookies([{
      name: 'token',
      value: authToken.token,
      domain: '.qa-path.com',
      path: '/',
    }]);
    
    // Perform UI login to establish full session (including connect.sid)
    // This ensures all session cookies are properly set
    await page.getByPlaceholder('Enter your email').fill('rahul@alternative-path.com');
    await page.getByPlaceholder('Enter your password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForTimeout(6000);
    
    console.log('✅ Browser session established with API token');

    // Use page.request which shares cookies with the browser context
    const browserRequest = page.request;
    console.log('✅ Using browser request context (shares cookies automatically)');

    // ============================================
    // SECTION 2: Extract CSRF Token and Set Project via API
    // ============================================
    console.log('📋 Section 2: Extract CSRF Token and Set Project via API');

    // Extract auth token from page context (includes CSRF token automatically)
    // This ensures CSRF tokens are properly included in API requests
    const updatedAuthToken = await authTokenFromPage(page);

    // Extract and verify CSRF token using the helper
    const csrfToken = getCsrfToken(updatedAuthToken);
    if (csrfToken) {
      console.log('✅ CSRF Token extracted successfully');
      console.log(`   CSRF Token: ${csrfToken.substring(0, 20)}...`);
    } else {
      console.log('⚠️ CSRF Token not found - this may cause API calls to fail');
    }

    // Verify headers include CSRF token
    const headers = getAuthHeaders(updatedAuthToken);
    console.log('✅ Authentication headers prepared with CSRF token');
    if (csrfToken) {
      expect(headers['X-CSRF-Token']).toBe(csrfToken);
      console.log('✅ CSRF Token verified in headers');
    }

    const projectId = 'd7735c45-30e0-417a-806f-524b000bf75d'; // QAPathAuto project
    const projectData = await setProjectViaAPI(browserRequest, projectId, updatedAuthToken);
    console.log(`✅ Project set: ${projectData.project.name} (${projectData.project.key})`);

    // ============================================
    // SECTION 3: Generate Dynamic Description
    // ============================================
    console.log('📋 Section 3: Generate Dynamic Description');

    // Generate dynamic DateTime for description
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const dynamicDescription = `CreatedbyAuto-${dateTime}`;

    console.log(`📝 Generated dynamic description: ${dynamicDescription}`);

    // ============================================
    // SECTION 4: Create Test Case via API
    // ============================================
    console.log('📋 Section 4: Create Test Case via API');

    const moduleId = 'b4750b1c-1db3-421b-99ba-f8d1230d4be2'; // CreatedbyAutomation module

    // Use the updated auth token which includes CSRF token
    // This ensures CSRF token is properly included in the request headers
    // Even though page.request shares cookies, we need to explicitly pass authToken
    // to ensure getAuthHeaders() adds the X-CSRF-Token header
    const testCaseData = await createTestCaseViaAPI(browserRequest, {
      title: 'TC Created by Automation',
      description: dynamicDescription,
      moduleId,
      projectId,
      type: 'Functional Test',
      status: 'New',
      priority: 'Normal',
      estimatedDuration: 15,
      automationStatus: 'Not Automated',
      executionMode: 'Manual',
      generatedBy: userId, // Include user ID from login response
      updatedBy: userId, // Include user ID from login response
    }, updatedAuthToken); // Pass authToken to ensure CSRF token is included via getAuthHeaders()

    // ============================================
    // SECTION 5: Verification and Output
    // ============================================
    console.log('📋 Section 5: Verification and Output');

    // Verify the test case was created successfully
    expect(testCaseData.success).toBe(true);
    expect(testCaseData.testCase).toBeDefined();
    expect(testCaseData.testCase?.id).toBeDefined();
    expect(testCaseData.testCase?.key).toBeDefined();
    expect(testCaseData.testCase?.title).toBe('TC Created by Automation');

    // Print the created test case name/key
    const testCaseName = testCaseData.testCase?.key || 'Unknown';
    const testCaseTitle = testCaseData.testCase?.title || 'Unknown';
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST CASE CREATED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log(`📝 Test Case Name (Key): ${testCaseName}`);
    console.log(`📋 Test Case Title: ${testCaseTitle}`);
    console.log(`🆔 Test Case ID: ${testCaseData.testCase?.id}`);
    console.log(`📄 Description: ${dynamicDescription}`);
    console.log('='.repeat(80) + '\n');

    // Return the test case name for potential use in other tests
    return testCaseName;
  });
});

