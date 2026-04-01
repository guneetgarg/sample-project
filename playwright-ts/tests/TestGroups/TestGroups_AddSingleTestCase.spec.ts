import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

test.describe('Add Single Test Case to Test Group', () => {
  test('should create a test group and add a single test case to it', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(120000);
    
    console.log('🔧 Starting Add Single Test Case to Test Group test...');
    
    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    console.log('📋 Section 1: Setup and Login');
    
    // Step 1: Login using the reusable helper
    await login(page);
    console.log('✅ Login completed');
    
    // ============================================
    // SECTION 2: Navigate to Test Groups Page
    // ============================================
    console.log('📋 Section 2: Navigate to Test Groups Page');
    
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    
    // Wait for page to load (10s after navigation as per instructions)
    await page.waitForTimeout(10000);
    
    // Verify we're on the Test Groups page
    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    
    // Verify Test Groups page content is visible
    await expect(page.getByText(/Test Groups|Test Groups Library/i).first()).toBeVisible({ timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');
    
    // ============================================
    // SECTION 3: Create New Test Group
    // ============================================
    console.log('📋 Section 3: Create New Test Group');
    
    // Step 2: Generate dynamic date/timestamp for the test group name
    const dynamicName = await page.evaluate(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      // Format: TestGroupwithTestCase-2025-12-12_04-35-51
      const dateTimestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      return `TestGroupwithTestCase-${dateTimestamp}`;
    });
    
    console.log(`📝 Generated dynamic test group name: ${dynamicName}`);
    
    // Step 3: Click "New Test Group" button
    const newTestGroupButton = page.getByRole('button', { name: 'New Test Group' });
    await expect(newTestGroupButton).toBeVisible({ timeout: 90000 });
    await newTestGroupButton.click();
    console.log('✅ Clicked New Test Group button');
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Verify modal is visible
    await expect(page.getByRole('heading', { name: 'Create New Test Group' })).toBeVisible({ timeout: 90000 });
    console.log('✅ Create New Test Group modal is visible');
    
    // Step 4: Enter the dynamic name in the Group Name field
    const groupNameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(groupNameInput).toBeVisible({ timeout: 90000 });
    await groupNameInput.fill(dynamicName);
    console.log(`✅ Entered dynamic name: ${dynamicName}`);
    
    // Wait a moment for the input to be processed
    await page.waitForTimeout(500);
    
    // Step 5: Click Create button
    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeVisible({ timeout: 90000 });
    await expect(createButton).toBeEnabled({ timeout: 90000 });
    await createButton.click();
    console.log('✅ Clicked Create button');
    
    // Wait for navigation after creation (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // Verify that the test group was created successfully
    const successAlert = page.getByText(/Test group created successfully|created successfully/i).first();
    const isSuccessVisible = await successAlert.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSuccessVisible) {
      console.log('✅ Success message is visible');
    }
    
    // Verify we're on the test group detail page
    await expect(page).toHaveURL(new RegExp('/test-groups/'), { timeout: 90000 });
    await expect(page.getByText(dynamicName)).toBeVisible({ timeout: 90000 });
    console.log('✅ Test group created and detail page is visible');
    
    // ============================================
    // SECTION 4: Add Test Case to Group
    // ============================================
    console.log('📋 Section 4: Add Test Case to Group');
    
    // Step 6: Click "Add Test Case to Group" button
    const addTestCaseButton = page.getByRole('button', { name: 'Add Test Case to Group' });
    await expect(addTestCaseButton).toBeVisible({ timeout: 90000 });
    await addTestCaseButton.click();
    console.log('✅ Clicked Add Test Case to Group button');
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Verify "Add Test Cases to Group" modal is visible
    await expect(page.getByRole('heading', { name: /Add Test Cases to Group/i })).toBeVisible({ timeout: 90000 });
    console.log('✅ Add Test Cases to Group modal is visible');
    
    // Step 7: Search for module "Scenarios [DO NOT EDIT]"
    // The modal should have a Search Modules field - use the visible one
    const searchModulesInputs = page.getByRole('textbox', { name: 'Search Modules' });
    const searchModulesInput = searchModulesInputs.first();
    await expect(searchModulesInput).toBeVisible({ timeout: 90000 });
    await searchModulesInput.fill('Scenarios [DO NOT EDIT]');
    console.log('✅ Entered "Scenarios [DO NOT EDIT]" in Search Modules field');
    
    // Wait for search results to filter
    await page.waitForTimeout(2000);
    
    // Step 8: Click the "Scenarios [DO NOT EDIT]" folder
    const scenariosFolder = page.getByRole('treeitem', { name: /Scenarios \[DO NOT EDIT\]/i });
    await expect(scenariosFolder).toBeVisible({ timeout: 90000 });
    await scenariosFolder.click();
    console.log('✅ Clicked Scenarios [DO NOT EDIT] folder');
    
    // Wait for test cases to load
    await page.waitForTimeout(2000);
    
    // Verify test cases are displayed
    await expect(page.getByText(/Select test cases to add/i)).toBeVisible({ timeout: 90000 });
    console.log('✅ Test cases selection view is visible');
    
    // Step 9: Search for test case "QAPA-31"
    const searchTestCasesInput = page.getByRole('textbox', { name: 'Search Test Cases' });
    await expect(searchTestCasesInput).toBeVisible({ timeout: 90000 });
    await searchTestCasesInput.fill('QAPA-31');
    console.log('✅ Entered "QAPA-31" in Search Test Cases field');
    
    // Wait for search results
    await page.waitForTimeout(2000);
    
    // Step 10: Select the checkbox for QAPA-31
    const qapa31Checkbox = page.getByRole('checkbox', { name: /Select row|Unselect row/i }).first();
    await expect(qapa31Checkbox).toBeVisible({ timeout: 90000 });
    await qapa31Checkbox.click();
    console.log('✅ Selected checkbox for QAPA-31');
    
    // Wait for selection to be processed
    await page.waitForTimeout(500);
    
    // Step 11: Click Add button
    const addButton = page.getByRole('button', { name: 'Add', exact: true });
    await expect(addButton).toBeVisible({ timeout: 90000 });
    await expect(addButton).toBeEnabled({ timeout: 90000 });
    await addButton.click();
    console.log('✅ Clicked Add button');
    
    // Wait for test case to be added (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // Step 12: Click Close button to close the modal
    const closeButton = page.getByRole('button', { name: 'Close' });
    await expect(closeButton).toBeVisible({ timeout: 90000 });
    await closeButton.click();
    console.log('✅ Clicked Close button');
    
    // Wait for modal to close
    await page.waitForTimeout(1000);
    
    // ============================================
    // SECTION 5: Verification
    // ============================================
    console.log('📋 Section 5: Verification');
    
    // Step 13: Verify QAPA-31 is added under the Test Group Cases grid
    console.log('🔍 Verifying QAPA-31 is added to Test Group Cases...');
    
    // Verify test case count updated in Test Group Cases section
    const testGroupCasesSection = page.getByText(/Test Group Cases/i);
    await expect(testGroupCasesSection).toBeVisible({ timeout: 90000 });
    const totalText = await page.getByText(/\d+ total/i).filter({ hasText: /total/i }).first().textContent();
    const totalCount = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
    expect(totalCount).toBeGreaterThan(0);
    console.log(`✅ Test Group Cases total: ${totalCount}`);
    
    // Verify QAPA-31 is visible in the Test Group Cases grid
    const qapa31InGrid = page.getByRole('row').filter({ hasText: 'QAPA-31' });
    await expect(qapa31InGrid).toBeVisible({ timeout: 90000 });
    console.log('✅ QAPA-31 is visible in Test Group Cases grid');
    
    // Verify QAPA-31 details
    const qapa31TestId = qapa31InGrid.getByText('QAPA-31');
    await expect(qapa31TestId).toBeVisible({ timeout: 90000 });
    
    const qapa31Summary = qapa31InGrid.getByText('Add New Test Case');
    await expect(qapa31Summary).toBeVisible({ timeout: 90000 });
    console.log('✅ QAPA-31 details are correct (Test ID and Summary)');
    
    // Verify test cases summary updated in Overview section
    const testCasesSummaryText = await page.getByText(/Test Cases Summary/i).locator('..').getByText(/\d+/).first().textContent();
    const summaryCount = testCasesSummaryText ? parseInt(testCasesSummaryText.match(/\d+/)?.[0] || '0') : 0;
    expect(summaryCount).toBeGreaterThan(0);
    console.log(`✅ Test Cases Summary shows: ${summaryCount} test case(s)`);
    
    // Verify module is shown in the modules tree
    const scenariosModule = page.getByText(/Scenarios \[DO NOT EDIT\]/i);
    const isModuleVisible = await scenariosModule.isVisible({ timeout: 5000 }).catch(() => false);
    if (isModuleVisible) {
      console.log('✅ Scenarios [DO NOT EDIT] module is visible in the modules tree');
    }
    
    console.log('✅ Add Single Test Case to Test Group test completed successfully');
  });
});

