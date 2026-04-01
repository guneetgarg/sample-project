import { test, expect } from '@playwright/test';
import { setupTestGroupWithTestCase } from '../helpers/setupTestGroupWithTestCase';
import { login } from '../helpers/login';
import { loginViaAPI, getCsrfToken, getAuthHeaders } from '../helpers/api/login';
import { setProjectViaAPI } from '../helpers/api/setProject';
import { createTestLaunchViaAPI, getAiModelId } from '../helpers/api/createTestLaunch';
import { authTokenFromPage } from '../helpers/api/authTokenFromPage';

test.describe('Create Test Launch via API', () => {
  test('should create a test launch using API instead of UI interactions', async ({ page, request }) => {
    test.setTimeout(180000);

    console.log('🚀 Starting Create Test Launch via API test...');

    // ============================================
    // SECTION 1: Login via UI (to establish session properly)
    // ============================================
    console.log('📋 Section 1: Login via UI to establish session');

    // Login via UI first to establish the session properly
    // This ensures cookies (token + connect.sid) are set in the browser context
    await login(page);
    console.log('✅ Login completed via UI - session established');

    // Use page.request which shares cookies with the browser context
    const browserRequest = page.request;
    console.log('✅ Using browser request context (shares cookies automatically)');

    // ============================================
    // SECTION 2: Extract CSRF Token and Set Project via API
    // ============================================
    console.log('📋 Section 2: Extract CSRF Token and Set Project via API');

    // Extract auth token from page context (includes CSRF token automatically)
    const authToken = await authTokenFromPage(page);

    // Extract and verify CSRF token using the helper
    const csrfToken = getCsrfToken(authToken);
    if (csrfToken) {
      console.log('✅ CSRF Token extracted successfully');
      console.log(`   CSRF Token: ${csrfToken.substring(0, 20)}...`);
    } else {
      console.log('⚠️ CSRF Token not found - this may cause API calls to fail');
    }

    // Verify headers include CSRF token
    const headers = getAuthHeaders(authToken);
    console.log('✅ Authentication headers prepared with CSRF token');
    if (csrfToken) {
      expect(headers['X-CSRF-Token']).toBe(csrfToken);
      console.log('✅ CSRF Token verified in headers');
    }

    // Set the project using the API with browser request context
    const projectId = 'd7735c45-30e0-417a-806f-524b000bf75d'; // QAPathAuto project
    const projectData = await setProjectViaAPI(browserRequest, projectId, authToken);
    console.log(`✅ Project set: ${projectData.project.name} (${projectData.project.key})`);

    // ============================================
    // SECTION 3: Setup Test Group with Test Case
    // ============================================
    console.log('📋 Section 3: Setup Test Group with Test Case');

    // Navigate directly to test groups page (we're already logged in and project is set)
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(5000);
    console.log('✅ Navigated to Test Groups page');

    // Create new test group with dynamic name
    const dynamicName = await page.evaluate(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const dateTimestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      return `TestGroupwithTestCase-${dateTimestamp}`;
    });
    console.log(`📝 Generated dynamic test group name: ${dynamicName}`);

    await page.getByRole('button', { name: 'New Test Group' }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: 'Create New Test Group' })).toBeVisible({ timeout: 90000 });
    await page.getByRole('textbox', { name: 'Enter group name' }).fill(dynamicName);
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(6000);

    // Get the test group ID from the URL
    const currentUrl = page.url();
    const testGroupIdMatch = currentUrl.match(/\/test-groups\/([a-f0-9-]+)/i);
    if (!testGroupIdMatch) {
      throw new Error('Could not extract test group ID from URL');
    }
    const testGroupId = testGroupIdMatch[1];
    console.log(`✅ Test group created: ${dynamicName} (ID: ${testGroupId})`);

    // Add test case to group
    await page.getByRole('button', { name: 'Add Test Case to Group' }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: /Add Test Cases to Group/i })).toBeVisible({ timeout: 90000 });
    const searchModulesInput = page.getByRole('textbox', { name: 'Search Modules' }).first();
    await expect(searchModulesInput).toBeVisible({ timeout: 90000 });
    await searchModulesInput.fill('Scenarios [DO NOT EDIT]');
    await page.waitForTimeout(2000);
    const scenariosFolder = page.getByRole('treeitem', { name: /Scenarios \[DO NOT EDIT\]/i });
    await expect(scenariosFolder).toBeVisible({ timeout: 90000 });
    await scenariosFolder.click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Select test cases to add/i)).toBeVisible({ timeout: 90000 });
    const searchTestCasesInput = page.getByRole('textbox', { name: 'Search Test Cases' });
    await expect(searchTestCasesInput).toBeVisible({ timeout: 90000 });
    await searchTestCasesInput.fill('QAPA-31');
    await page.waitForTimeout(2000);
    const qapa31Checkbox = page.getByRole('row', { name: /QAPA-31/i }).getByRole('checkbox').first();
    await expect(qapa31Checkbox).toBeVisible({ timeout: 90000 });
    await qapa31Checkbox.click();
    await page.waitForTimeout(500);
    const addButton = page.getByRole('button', { name: 'Add', exact: true });
    await expect(addButton).toBeVisible({ timeout: 90000 });
    await expect(addButton).toBeEnabled({ timeout: 90000 });
    await addButton.click();
    await page.waitForTimeout(6000);
    const closeButton = page.getByRole('button', { name: 'Close' });
    await expect(closeButton).toBeVisible({ timeout: 90000 });
    await closeButton.click();
    await page.waitForTimeout(1000);

    // Verify test case is added
    const testGroupCasesSection = page.getByText(/Test Group Cases/i);
    await expect(testGroupCasesSection).toBeVisible({ timeout: 90000 });
    const qapa31InGrid = page.getByRole('row').filter({ hasText: 'QAPA-31' });
    await expect(qapa31InGrid).toBeVisible({ timeout: 90000 });
    console.log(`✅ Test group "${dynamicName}" is ready with test case QAPA-31`);


    // ============================================
    // SECTION 4: Create Test Launch via API
    // ============================================
    console.log('📋 Section 4: Create Test Launch via API');

    // Get the AI model ID for "5.1 model"
    // Use browserRequest which has cookies from browser session
    console.log('🔍 Fetching AI model ID for "5.1 model"...');
    const aiModelId = await getAiModelId(browserRequest, '5.1 model', authToken);
    if (!aiModelId) {
      console.log('⚠️ Could not find AI model ID, will use default');
    } else {
      console.log(`✅ Found AI Model ID: ${aiModelId}`);
    }

    // Create launch name with timestamp
    const launchName = `${dynamicName}-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;

    // Create the test launch via API using browser request context
    // This automatically includes all cookies from the browser session
    // Pass projectId to ensure x-project-id header is set for permission checks
    const launchData = await createTestLaunchViaAPI(browserRequest, {
      testGroupId,
      launchName,
      aiModelId: aiModelId || '5.1', // Fallback to '5.1' if ID not found
      startTime: 'immediate',
      projectId: projectId, // Pass project ID for x-project-id header
    }, authToken);

    console.log(`✅ Test launch created via API: ${launchData.launchName || launchName}`);

    // ============================================
    // SECTION 5: Verify Launch in UI
    // ============================================
    console.log('📋 Section 5: Verify Launch in UI');

    // Navigate to the test group page to see the launch
    await page.goto(`https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups/${testGroupId}`);
    await page.waitForTimeout(3000);

    // Click on Test Launches tab
    const testLaunchesTab = page.getByRole('tab', { name: /Test Launches/i });
    await expect(testLaunchesTab).toBeVisible({ timeout: 90000 });
    await testLaunchesTab.click();
    await page.waitForTimeout(2000);

    // Verify Test Launch History section is visible
    const testLaunchHistory = page.getByText(/Test Launch History/i);
    await expect(testLaunchHistory).toBeVisible({ timeout: 90000 });
    console.log('✅ Test Launch History section is visible');

    // Verify launch count is greater than 0
    const launchCountText = await page.getByText(/\d+ total/i).filter({ hasText: /total/i }).first().textContent();
    const launchCount = launchCountText ? parseInt(launchCountText.match(/\d+/)?.[0] || '0') : 0;
    expect(launchCount).toBeGreaterThan(0);
    console.log(`✅ Test Launch History shows ${launchCount} launch(es)`);

    // Verify the launch row is visible in the grid
    // The launch name should contain the test group name
    const launchRow = page.getByRole('row').filter({ hasText: new RegExp(dynamicName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
    await expect(launchRow).toBeVisible({ timeout: 90000 });
    console.log(`✅ Launch row is visible in Test Launch History grid (contains "${dynamicName}")`);

    // Verify launch details in the grid
    const launchId = launchRow.getByText(/TL-\d+/);
    await expect(launchId).toBeVisible({ timeout: 90000 });
    console.log('✅ Launch ID is visible in the grid');

    // Verify launch status (should be "In Progress" or similar)
    const launchStatus = launchRow.getByText(/In Progress|Completed|Failed/i);
    const isStatusVisible = await launchStatus.isVisible({ timeout: 5000 }).catch(() => false);
    if (isStatusVisible) {
      const statusText = await launchStatus.textContent();
      console.log(`✅ Launch status is visible: ${statusText}`);
    }

    console.log('✅ Create Test Launch via API test completed successfully');
    console.log('\n📊 Summary:');
    console.log(`   - Test Group: ${dynamicName}`);
    console.log(`   - Launch Name: ${launchData.launchName || launchName}`);
    console.log(`   - Launch ID: ${launchData.id || 'N/A'}`);
    console.log(`   - Method: API (faster than UI interactions)`);
    console.log(`   - API Calls Used: Login (UI) + SetProject (API) + CreateLaunch (API)`);
  });
});

