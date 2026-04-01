import { test, expect } from '@playwright/test';
import { loginViaAPI, getCsrfToken, getAuthHeaders } from '../helpers/api/login';
import { setProjectViaAPI } from '../helpers/api/setProject';
import { createTestCaseViaAPI } from '../helpers/api/createTestCase';
import { authTokenFromPage } from '../helpers/api/authTokenFromPage';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Create Test Case via API', () => {
  test('should create a test case using API helper functions', async ({ page, request }) => {
    test.setTimeout(120000);

    console.log('🔄 Starting Create Test Case via API test...');

    // ============================================
    // SECTION 1: Login via API
    // ============================================
    console.log('📋 Section 1: Login via API');

    const email = 'rahul@alternative-path.com';
    const password = 'Admin@123';

    // 💥 FAILURE INJECTION POINT 1: Connection refused before login
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating connection refused to auth server...');
      throw new Error('net::ERR_CONNECTION_REFUSED at https://qa-path.com/api/auth/login - The authentication server is unreachable.');
    }

    const loginResponse = await loginViaAPI(request, email, password);
    expect(loginResponse.status).toBe(200);
    console.log('✅ Login via API successful');

    // ============================================
    // SECTION 2: Get Auth Headers
    // ============================================
    console.log('📋 Section 2: Get Auth Headers');

    const authHeaders = await getAuthHeaders(request);
    expect(authHeaders).toBeTruthy();

    // 💥 FAILURE INJECTION POINT 2: Assertion failure on headers
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting auth headers have expected format...');
      expect(Object.keys(authHeaders).length).toBe(0); // Will fail since headers exist
    }

    console.log('✅ Auth headers retrieved');

    // ============================================
    // SECTION 3: Set Project
    // ============================================
    console.log('📋 Section 3: Set Project via API');

    const projectId = 'd7735c45-30e0-417a-806f-524b000bf75d';

    // 💥 FAILURE INJECTION POINT 3: API failure during project setup
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating 500 Internal Server Error on project setup...');
      throw new Error('API Error: 500 Internal Server Error - setProjectViaAPI failed with: {"error":"Internal server error","message":"Database connection pool exhausted"}');
    }

    try {
      const projectData = await setProjectViaAPI(request, projectId, authHeaders);
      console.log(`✅ Project set: ${projectData.project.name}`);
    } catch (error: any) {
      if (error.message && error.message.includes('Route Permission Mapping')) {
        console.log('⚠️ setProject failed with permission error, continuing...');
      } else {
        throw error;
      }
    }

    // ============================================
    // SECTION 4: Create Test Case
    // ============================================
    console.log('📋 Section 4: Create Test Case via API');

    const testCaseSummary = `Auto TC - ${new Date().toISOString().replace(/[:.]/g, '-')}`;

    // 💥 FAILURE INJECTION POINT 4: Network failure before test case creation
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating network timeout during test case creation...');
      throw new Error('TimeoutError: Request to https://qa-path.com/api/testcase/create timed out after 30000ms. The server did not respond in time.');
    }

    const testCaseData = await createTestCaseViaAPI(request, {
      summary: testCaseSummary,
      description: 'Test case created via API automation',
      priority: 'Medium',
      type: 'Functional',
      automationStatus: 'Automated',
    }, authHeaders);

    // 💥 FAILURE INJECTION POINT 5: Assertion failure on created test case
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting test case has unexpected ID format...');
      expect(testCaseData.testCaseId).toMatch(/^INVALID-FORMAT-[0-9]{20}$/);
    }

    console.log(`✅ Test case created: ${testCaseData.testCaseId || testCaseSummary}`);

    // ============================================
    // SECTION 5: Verify Test Case in UI
    // ============================================
    console.log('📋 Section 5: Verify in UI');

    // 💥 FAILURE INJECTION POINT 6: Navigation timeout
    await maybeFailAt(page, 'before-navigate-to-verify-tc', 0.15, getFailureTypesForPhase('navigation'));

    const testCasesUrl = `https://qa-path.com/home/projects/${projectId}/test-cases`;
    await page.goto(testCasesUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 7: Element not found during verification
    await maybeFailAt(page, 'during-tc-ui-verification', 0.2, getFailureTypesForPhase('verification'));

    console.log('✅ Create Test Case via API test completed successfully');
  });
});
