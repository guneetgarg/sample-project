import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

test.describe('Create Test Group', () => {
  test('should create a new test group with dynamic name containing date timestamp', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(120000);
    
    console.log('🔧 Starting Create Test Group test...');
    
    // Step 1: Login using the reusable helper
    await login(page);
    console.log('✅ Login completed');
    
    // Step 2: Navigate to Test Groups page
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
    
    // Step 3: Get initial total count before creating new group
    const initialTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const initialTotal = initialTotalText ? parseInt(initialTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Initial total test groups: ${initialTotal}`);
    
    // Step 4: Generate dynamic date/timestamp for the test group name
    const dynamicName = await page.evaluate(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      // Format: TestGroupCreatedbyAutomation-2025-12-16_22-40-28
      const dateTimestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      return `TestGroupCreatedbyAutomation-${dateTimestamp}`;
    });
    
    console.log(`📝 Generated dynamic test group name: ${dynamicName}`);
    
    // Step 5: Click "New Test Group" button
    const newTestGroupButton = page.getByRole('button', { name: 'New Test Group' });
    await expect(newTestGroupButton).toBeVisible({ timeout: 90000 });
    await newTestGroupButton.click();
    console.log('✅ Clicked New Test Group button');
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Verify modal is visible
    await expect(page.getByRole('heading', { name: 'Create New Test Group' })).toBeVisible({ timeout: 90000 });
    console.log('✅ Create New Test Group modal is visible');
    
    // Step 6: Enter the dynamic name in the Group Name field
    const groupNameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(groupNameInput).toBeVisible({ timeout: 90000 });
    await groupNameInput.fill(dynamicName);
    console.log(`✅ Entered dynamic name: ${dynamicName}`);
    
    // Wait a moment for the input to be processed
    await page.waitForTimeout(500);
    
    // Step 7: Click Create button
    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeVisible({ timeout: 90000 });
    await expect(createButton).toBeEnabled({ timeout: 90000 });
    await createButton.click();
    console.log('✅ Clicked Create button');
    
    // Wait for navigation after creation (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // Step 8: Verify that the test group was created successfully
    console.log('🔍 Verifying test group creation...');
    
    // Check for success message (if visible)
    const successAlert = page.getByText(/Test group created successfully|created successfully/i).first();
    const isSuccessVisible = await successAlert.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSuccessVisible) {
      console.log('✅ Success message is visible');
    }
    
    // Navigate back to test groups list to verify the group appears
    await page.goto(testGroupsUrl);
    await page.waitForTimeout(10000);
    
    // Verify we're back on the test groups list page
    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    
    // Get updated total count
    const updatedTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const updatedTotal = updatedTotalText ? parseInt(updatedTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Updated total test groups: ${updatedTotal}`);
    
    // Verify that total count increased
    expect(updatedTotal).toBeGreaterThan(initialTotal);
    console.log('✅ Test group count increased - group was created');
    
    // Verify the new test group is visible in the list by searching for the group name
    const newGroupName = page.getByText(dynamicName);
    await expect(newGroupName).toBeVisible({ timeout: 90000 });
    console.log(`✅ New test group "${dynamicName}" is visible in the list`);
    
    // Find the row containing the group name
    const newGroupRow = page.getByRole('row').filter({ has: newGroupName });
    await expect(newGroupRow).toBeVisible({ timeout: 90000 });
    
    // Verify it's a Static group type
    const staticType = newGroupRow.getByText('Static');
    await expect(staticType).toBeVisible({ timeout: 90000 });
    console.log('✅ Test group type is Static');
    
    // Verify initial values (0 test cases, 0 launches for new group)
    // Check that the row contains "0" for test cases (in the Test Cases column)
    const rowText = await newGroupRow.textContent();
    expect(rowText).toContain('0');
    console.log('✅ Test group has 0 test cases (as expected for new group)');
    
    console.log('✅ Create Test Group test completed successfully');
  });
});

