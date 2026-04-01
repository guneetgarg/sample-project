import { Page, expect } from '@playwright/test';
import { loginIfNeeded } from './login';

/**
 * Reusable function to setup a test group with a test case
 * This function performs:
 * 1. Login
 * 2. Navigate to Test Groups page
 * 3. Create a new test group with dynamic name
 * 4. Add a test case (QAPA-31) to the group
 * 5. Verify the test case is added
 * 
 * @param page - Playwright page object
 * @param testCaseId - Test case ID to add (default: 'QAPA-31')
 * @param moduleName - Module name to search for (default: 'Scenarios [DO NOT EDIT]')
 * @returns The dynamic test group name that was created
 * 
 * @example
 * ```typescript
 * import { setupTestGroupWithTestCase } from '../helpers/setupTestGroupWithTestCase';
 * 
 * test('my test', async ({ page }) => {
 *   const groupName = await setupTestGroupWithTestCase(page);
 *   // Continue with your test using the group...
 * });
 * ```
 */
export async function setupTestGroupWithTestCase(
  page: Page,
  testCaseId: string = 'QAPA-31',
  moduleName: string = 'Scenarios [DO NOT EDIT]'
): Promise<string> {
  console.log('🔧 Setting up test group with test case...');
  
  // Step 1: Login using the reusable helper (only if not already logged in)
  await loginIfNeeded(page);
  console.log('✅ Login completed');
  
  // Step 2: Navigate to Test Groups page
  const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
  await page.goto(testGroupsUrl);
  
  // Wait for page to load (10s after navigation as per instructions)
  await page.waitForTimeout(10000);
  
  // Verify we're on the Test Groups page
  await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
  await expect(page).toHaveTitle('QA Path', { timeout: 90000 });
  
  // Verify Test Groups page content is visible
  await expect(page.getByText(/Test Groups|Test Groups Library/i).first()).toBeVisible({ timeout: 90000 });
  console.log('✅ Navigated to Test Groups page');
  
  // Step 3: Generate dynamic date/timestamp for the test group name
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
  
  // Step 4: Click "New Test Group" button
  const newTestGroupButton = page.getByRole('button', { name: 'New Test Group' });
  await expect(newTestGroupButton).toBeVisible({ timeout: 90000 });
  await newTestGroupButton.click();
  console.log('✅ Clicked New Test Group button');
  
  // Wait for modal to appear
  await page.waitForTimeout(1000);
  
  // Verify modal is visible
  await expect(page.getByRole('heading', { name: 'Create New Test Group' })).toBeVisible({ timeout: 90000 });
  console.log('✅ Create New Test Group modal is visible');
  
  // Step 5: Enter the dynamic name in the Group Name field
  const groupNameInput = page.getByRole('textbox', { name: 'Enter group name' });
  await expect(groupNameInput).toBeVisible({ timeout: 90000 });
  await groupNameInput.fill(dynamicName);
  console.log(`✅ Entered dynamic name: ${dynamicName}`);
  
  // Wait a moment for the input to be processed
  await page.waitForTimeout(500);
  
  // Step 6: Click Create button
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
  
  // Verify we're on the test group detail page (could be /test-groups or /test-groups/{id})
  await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
  await expect(page.getByText(dynamicName)).toBeVisible({ timeout: 90000 });
  console.log('✅ Test group created and detail page is visible');
  
  // Step 7: Click "Add Test Case to Group" button
  const addTestCaseButton = page.getByRole('button', { name: 'Add Test Case to Group' });
  await expect(addTestCaseButton).toBeVisible({ timeout: 90000 });
  await addTestCaseButton.click();
  console.log('✅ Clicked Add Test Case to Group button');
  
  // Wait for modal to appear
  await page.waitForTimeout(1000);
  
  // Verify "Add Test Cases to Group" modal is visible
  await expect(page.getByRole('heading', { name: /Add Test Cases to Group/i })).toBeVisible({ timeout: 90000 });
  console.log('✅ Add Test Cases to Group modal is visible');
  
  // Step 8: Search for module
  const searchModulesInputs = page.getByRole('textbox', { name: 'Search Modules' });
  const searchModulesInput = searchModulesInputs.first();
  await expect(searchModulesInput).toBeVisible({ timeout: 90000 });
  await searchModulesInput.fill(moduleName);
  console.log(`✅ Entered "${moduleName}" in Search Modules field`);
  
  // Wait for search results to filter
  await page.waitForTimeout(2000);
  
  // Step 9: Click the module folder
  const moduleFolder = page.getByRole('treeitem', { name: new RegExp(moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
  await expect(moduleFolder).toBeVisible({ timeout: 90000 });
  await moduleFolder.click();
  console.log(`✅ Clicked ${moduleName} folder`);
  
  // Wait for test cases to load
  await page.waitForTimeout(2000);
  
  // Verify test cases are displayed
  await expect(page.getByText(/Select test cases to add/i)).toBeVisible({ timeout: 90000 });
  console.log('✅ Test cases selection view is visible');
  
  // Step 10: Search for test case
  const searchTestCasesInput = page.getByRole('textbox', { name: 'Search Test Cases' });
  await expect(searchTestCasesInput).toBeVisible({ timeout: 90000 });
  await searchTestCasesInput.fill(testCaseId);
  console.log(`✅ Entered "${testCaseId}" in Search Test Cases field`);
  
  // Wait for search results
  await page.waitForTimeout(2000);
  
  // Step 11: Select the checkbox for the test case
  const testCaseCheckbox = page.getByRole('checkbox', { name: /Select row|Unselect row/i }).first();
  await expect(testCaseCheckbox).toBeVisible({ timeout: 90000 });
  await testCaseCheckbox.click();
  console.log(`✅ Selected checkbox for ${testCaseId}`);
  
  // Wait for selection to be processed
  await page.waitForTimeout(500);
  
  // Step 12: Click Add button
  const addButton = page.getByRole('button', { name: 'Add', exact: true });
  await expect(addButton).toBeVisible({ timeout: 90000 });
  await expect(addButton).toBeEnabled({ timeout: 90000 });
  await addButton.click();
  console.log('✅ Clicked Add button');
  
  // Wait for test case to be added (6s after action as per instructions)
  await page.waitForTimeout(6000);
  
  // Step 13: Close the modal if it's still open
  // Check if the modal is still visible
  const modalHeading = page.getByRole('heading', { name: /Add Test Cases to Group/i });
  const isModalStillVisible = await modalHeading.isVisible({ timeout: 3000 }).catch(() => false);
  
  if (isModalStillVisible) {
    console.log('📋 Modal is still visible, attempting to close it...');
    
    // Try to find and click the Close button
    const closeButton = page.getByRole('button', { name: 'Close' });
    const isCloseButtonVisible = await closeButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isCloseButtonVisible) {
      await closeButton.click();
      console.log('✅ Clicked Close button');
      
      // Wait for modal to close and verify it's closed
      await expect(modalHeading).not.toBeVisible({ timeout: 10000 });
      console.log('✅ Modal is closed');
    } else {
      // If Close button is not visible, try pressing Escape key or clicking outside
      console.log('⚠️ Close button not visible, trying alternative methods...');
      
      // Try pressing Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      // Verify modal is closed
      const isModalClosed = await modalHeading.isVisible({ timeout: 3000 }).catch(() => false);
      if (!isModalClosed) {
        console.log('✅ Modal closed using Escape key');
      } else {
        console.log('⚠️ Modal may still be open, continuing with verification...');
      }
    }
  } else {
    console.log('✅ Modal closed automatically after adding test case');
  }
  
  // Final verification that modal is closed
  await page.waitForTimeout(1000);
  
  // Step 14: Verify test case is added
  const qapa31InGrid = page.getByRole('row').filter({ hasText: testCaseId });
  await expect(qapa31InGrid).toBeVisible({ timeout: 90000 });
  console.log(`✅ ${testCaseId} is visible in Test Group Cases grid`);
  
  console.log('✅ Test group setup completed successfully');
  
  return dynamicName;
}

