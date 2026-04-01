import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { maybeFailAt, getFailureTypesForPhase } from '../helpers/failureInjector';

test.describe('Test Group - Verify Overview Details', () => {
  test('should verify all overview details on a test group detail page', async ({ page }) => {
    test.setTimeout(180000);

    console.log('📋 Starting Test Group - Verify Overview Details test...');

    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    await login(page);
    console.log('✅ Login completed');

    // 💥 FAILURE INJECTION POINT 1: After login
    await maybeFailAt(page, 'after-login-verify-overview', 0.15, getFailureTypesForPhase('setup'));

    // ============================================
    // SECTION 2: Navigate and Create Test Group
    // ============================================
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);

    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');

    // 💥 FAILURE INJECTION POINT 2: Navigation timeout
    await maybeFailAt(page, 'after-navigate-verify-overview', 0.15, getFailureTypesForPhase('navigation'));

    // Generate dynamic name
    const groupName = await page.evaluate(() => {
      const now = new Date();
      const dateTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      return `OverviewTestGroup-${dateTimestamp}`;
    });

    // Create test group
    const newButton = page.getByRole('button', { name: 'New Test Group' });
    await expect(newButton).toBeVisible({ timeout: 90000 });
    await newButton.click();
    await page.waitForTimeout(1000);

    // 💥 FAILURE INJECTION POINT 3: Element not found in modal
    await maybeFailAt(page, 'before-fill-tg-name-overview', 0.15, ['element-not-found', 'element-not-visible']);

    const nameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(nameInput).toBeVisible({ timeout: 90000 });
    await nameInput.fill(groupName);
    await page.waitForTimeout(500);

    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeVisible({ timeout: 90000 });
    await createButton.click();
    await page.waitForTimeout(6000);
    console.log(`✅ Created test group: ${groupName}`);

    // ============================================
    // SECTION 3: Navigate to Overview Tab
    // ============================================
    await expect(page).toHaveURL(new RegExp('/test-groups/'), { timeout: 90000 });

    const overviewTab = page.getByRole('tab', { name: /Overview/i });
    await expect(overviewTab).toBeVisible({ timeout: 90000 });
    await overviewTab.click();
    await page.waitForTimeout(3000);
    console.log('✅ Clicked Overview tab');

    // 💥 FAILURE INJECTION POINT 4: Stale element after tab click
    await maybeFailAt(page, 'after-click-overview-tab', 0.2, ['stale-element', 'element-not-interactable']);

    // ============================================
    // SECTION 4: Verify Header Details
    // ============================================
    console.log('📋 Verifying Header Details...');

    // Verify group name in header
    await expect(page.getByText(groupName)).toBeVisible({ timeout: 90000 });
    console.log('  ✅ Group name visible in header');

    // Verify Group ID
    const groupIdElement = page.getByText(/ID: TG-\d+/i);
    await expect(groupIdElement).toBeVisible({ timeout: 90000 });
    console.log('  ✅ Group ID visible');

    // Verify Group Type
    const groupTypeElement = page.getByText('Static');
    await expect(groupTypeElement).toBeVisible({ timeout: 90000 });
    console.log('  ✅ Group type "Static" visible');

    // 💥 FAILURE INJECTION POINT 5: JavaScript exception during verification
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] JavaScript exception while reading overview details...');
      await page.evaluate(() => {
        throw new ReferenceError("overviewData is not defined");
      });
    }

    // ============================================
    // SECTION 5: Verify Test Case Summary Section
    // ============================================
    console.log('📋 Verifying Test Case Summary Section...');

    const testCaseSummarySection = page.getByText(/Test Case Summary|Test Cases/i).first();
    const isSummaryVisible = await testCaseSummarySection.isVisible({ timeout: 10000 }).catch(() => false);
    if (isSummaryVisible) {
      console.log('  ✅ Test Case Summary section visible');
    }

    // Check for test case count
    const testCaseCountElement = page.getByText(/0 Test Cases|No test cases/i).first();
    const isCountVisible = await testCaseCountElement.isVisible({ timeout: 5000 }).catch(() => false);
    if (isCountVisible) {
      console.log('  ✅ Test case count shows 0');
    }

    // 💥 FAILURE INJECTION POINT 6: Assertion failure on section content
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting overview shows non-zero test case count...');
      await expect(page.getByText(/50 Test Cases/i)).toBeVisible({ timeout: 2000 });
    }

    // ============================================
    // SECTION 6: Verify Launches Section
    // ============================================
    console.log('📋 Verifying Launches Section...');

    const launchesSection = page.getByText(/Launches|Test Launches|Launch History/i).first();
    const isLaunchVisible = await launchesSection.isVisible({ timeout: 10000 }).catch(() => false);
    if (isLaunchVisible) {
      console.log('  ✅ Launches section visible');
    }

    // 💥 FAILURE INJECTION POINT 7: Timeout exception
    await maybeFailAt(page, 'during-launches-verification', 0.15, ['timeout-exception', 'connection-refused']);

    // ============================================
    // SECTION 7: Verify Growth Section
    // ============================================
    console.log('📋 Verifying Growth Section...');

    const growthSection = page.getByText(/Growth|Trend|Analytics/i).first();
    const isGrowthVisible = await growthSection.isVisible({ timeout: 10000 }).catch(() => false);
    if (isGrowthVisible) {
      console.log('  ✅ Growth section visible');
    }

    // ============================================
    // SECTION 8: Verify Modules Section
    // ============================================
    console.log('📋 Verifying Modules Section...');

    const modulesSection = page.getByText(/Modules|Module Distribution/i).first();
    const isModulesVisible = await modulesSection.isVisible({ timeout: 10000 }).catch(() => false);
    if (isModulesVisible) {
      console.log('  ✅ Modules section visible');
    }

    // 💥 FAILURE INJECTION POINT 8: Frame detached during section verification
    await maybeFailAt(page, 'during-modules-verification', 0.15, ['frame-detached', 'stale-element']);

    // ============================================
    // SECTION 9: Final Verifications
    // ============================================
    console.log('📋 Final Verifications...');

    // Verify URL structure
    await expect(page).toHaveURL(new RegExp('/test-groups/[a-zA-Z0-9-]+'), { timeout: 90000 });
    console.log('  ✅ URL structure is correct');

    // Verify page title
    await expect(page).toHaveTitle('QA Path', { timeout: 90000 });
    console.log('  ✅ Page title is correct');

    // 💥 FAILURE INJECTION POINT 9: Final assertion mismatch
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Asserting page URL matches wrong pattern...');
      await expect(page).toHaveURL(/\/nonexistent-section\//i, { timeout: 2000 });
    }

    // 💥 FAILURE INJECTION POINT 10: Connection error on final check
    await maybeFailAt(page, 'final-verification-overview', 0.1, ['connection-refused', 'unexpected-alert']);

    console.log('✅ Test Group - Verify Overview Details test completed successfully');
  });
});
