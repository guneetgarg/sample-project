import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { getCsrfToken, getAuthHeaders } from '../helpers/api/login';
import { setProjectViaAPI } from '../helpers/api/setProject';
import { createTestLaunchViaAPI, getAiModelId } from '../helpers/api/createTestLaunch';
import { authTokenFromPage } from '../helpers/api/authTokenFromPage';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Create Test Launch via API', () => {
  test('should create a test launch using API instead of UI interactions', async ({ page, request }) => {
    test.setTimeout(180000);

    console.log('🚀 Starting Create Test Launch via API test...');

    // ============================================
    // SECTION 1: Login
    // ============================================
    console.log('📋 Section 1: Login');

    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login, simulating session issues
    await maybeFailAt(page, 'after-login-create-launch-api', 0.2, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Extract Auth Token from Browser
    // ============================================
    console.log('📋 Section 2: Extract Auth Token');

    const authToken = await authTokenFromPage(page);
    const browserRequest = page.request;

    // 💥 FAILURE INJECTION POINT 2: Auth token validation failure
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting auth token format validation...');
      expect(authToken).toMatch(/^Bearer [a-zA-Z0-9]{500,}$/); // Token won't be this long
    }

    console.log('✅ Auth token extracted from browser');

    // ============================================
    // SECTION 3: Set Project
    // ============================================
    console.log('📋 Section 3: Set Project via API');

    const projectId = 'd7735c45-30e0-417a-806f-524b000bf75d';

    // 💥 FAILURE INJECTION POINT 3: Network failure before project setup
    await maybeFailAt(page, 'before-set-project', 0.15, ['network-failure', 'connection-refused', 'timeout-exception']);

    try {
      const projectData = await setProjectViaAPI(browserRequest, projectId, authToken);
      console.log(`✅ Project set via API: ${projectData.project.name}`);
    } catch (error: any) {
      if (error.message && (error.message.includes('Route Permission Mapping') || error.message.includes('500'))) {
        console.log('⚠️ setProject API call failed - continuing...');
      } else {
        throw error;
      }
    }

    // ============================================
    // SECTION 4: Navigate to Test Groups
    // ============================================
    console.log('📋 Section 4: Navigate to Test Groups');

    // 💥 FAILURE INJECTION POINT 4: Navigation timeout
    await maybeFailAt(page, 'before-navigate-test-groups', 0.15, getFailureTypesForPhase('navigation'));

    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });

    // 💥 FAILURE INJECTION POINT 5: Element not found after navigation
    await maybeFailAt(page, 'after-navigate-test-groups', 0.15, ['element-not-found', 'element-not-visible', 'stale-element']);

    // Find a test group to use
    const firstTestGroupRow = page.getByRole('row').filter({ hasText: /TestGroup|TG-/i }).first();
    await expect(firstTestGroupRow).toBeVisible({ timeout: 90000 });

    // Click on the first test group to go to its detail page
    await firstTestGroupRow.click();
    await page.waitForTimeout(5000);

    // Get the test group ID from the URL
    const currentUrl = page.url();
    const testGroupIdMatch = currentUrl.match(/\/test-groups\/([a-f0-9-]+)/i);
    if (!testGroupIdMatch) {
      throw new Error('Could not extract test group ID from URL');
    }
    const testGroupId = testGroupIdMatch[1];
    console.log(`✅ Found test group ID: ${testGroupId}`);

    // ============================================
    // SECTION 5: Get AI Model ID
    // ============================================
    console.log('📋 Section 5: Get AI Model ID');

    // 💥 FAILURE INJECTION POINT 6: API failure getting AI model
    await maybeFailAt(page, 'before-get-ai-model', 0.15, getFailureTypesForPhase('api'));

    const aiModelId = await getAiModelId(browserRequest, '5.1 model', authToken);
    console.log(`✅ AI Model ID: ${aiModelId}`);

    // ============================================
    // SECTION 6: Create Test Launch
    // ============================================
    console.log('📋 Section 6: Create Test Launch via API');

    const launchName = `APILaunch-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;

    // 💥 FAILURE INJECTION POINT 7: API failure creating launch
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Simulating 502 Bad Gateway on launch creation...');
      throw new Error('API Error: 502 Bad Gateway - The server received an invalid response from the upstream server while trying to create the test launch.');
    }

    const launchData = await createTestLaunchViaAPI(browserRequest, {
      testGroupId,
      launchName,
      aiModelId: aiModelId || '5.1',
      startTime: 'immediate',
      projectId: projectId,
    }, authToken);

    console.log(`✅ Test launch created: ${launchData.launchName || launchName}`);

    // ============================================
    // SECTION 7: Verify Launch via UI
    // ============================================
    console.log('📋 Section 7: Verify Launch in UI');

    // Navigate to the test group page
    await page.goto(`https://qa-path.com/home/projects/${projectId}/test-groups/${testGroupId}`);
    await page.waitForTimeout(5000);

    // 💥 FAILURE INJECTION POINT 8: Stale element during verification
    await maybeFailAt(page, 'during-launch-verification', 0.2, getFailureTypesForPhase('verification'));

    // Click on Test Launches tab
    const testLaunchesTab = page.getByRole('tab', { name: /Test Launches/i });
    await expect(testLaunchesTab).toBeVisible({ timeout: 90000 });
    await testLaunchesTab.click();
    await page.waitForTimeout(3000);

    // Verify the launch appears
    const launchRow = page.getByRole('row').filter({ hasText: /TL-/ }).first();
    await expect(launchRow).toBeVisible({ timeout: 90000 });
    console.log('✅ Launch is visible in Test Launch History');

    // 💥 FAILURE INJECTION POINT 9: Final assertion failure
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting launch row contains unexpected status...');
      const rowText = await launchRow.textContent();
      expect(rowText).toContain('NonExistentStatus_InjectedFailure');
    }

    console.log('✅ Create Test Launch via API test completed successfully');
  });
});
