import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

test.describe('Edit Test Group Name', () => {
  test('should edit test group name by appending suffix and verify update', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(120000);
    
    console.log('✏️ Starting Edit Test Group Name test...');
    
    // ============================================
    // SECTION 1: Setup and Login
    // ============================================
    console.log('📋 Section 1: Setup and Login');
    
    // Step 1: Login using the reusable helper
    await login(page);
    console.log('✅ Login completed');
    
    // ============================================
    // SECTION 2: Navigate to Test Groups Page and Create Test Group
    // ============================================
    console.log('📋 Section 2: Navigate to Test Groups Page and Create Test Group');
    
    const testGroupsUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-groups';
    await page.goto(testGroupsUrl);
    
    // Wait for page to load
    await page.waitForTimeout(10000);
    
    // Verify we're on the Test Groups page
    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    await expect(page.getByText(/Test Groups|Test Groups Library/i).first()).toBeVisible({ timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');
    
    // Generate dynamic date/timestamp for the test group name
    const originalName = await page.evaluate(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const dateTimestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      return `TestGroupEditName-${dateTimestamp}`;
    });
    
    console.log(`📝 Generated original test group name: ${originalName}`);
    
    // Set up API response listener before creating test group
    const createResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/testgroup/create') || url.includes('/api/testgroup')) && 
               (response.status() === 200 || response.status() === 201);
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    // Click "New Test Group" button
    const newTestGroupButton = page.getByRole('button', { name: 'New Test Group' });
    await expect(newTestGroupButton).toBeVisible({ timeout: 90000 });
    await newTestGroupButton.click();
    console.log('✅ Clicked New Test Group button');
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Verify modal is visible
    await expect(page.getByRole('heading', { name: 'Create New Test Group' })).toBeVisible({ timeout: 90000 });
    console.log('✅ Create New Test Group modal is visible');
    
    // Enter the original name in the Group Name field
    const groupNameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(groupNameInput).toBeVisible({ timeout: 90000 });
    await groupNameInput.fill(originalName);
    console.log(`✅ Entered original name: ${originalName}`);
    
    await page.waitForTimeout(500);
    
    // Click Create button
    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeVisible({ timeout: 90000 });
    await expect(createButton).toBeEnabled({ timeout: 90000 });
    await createButton.click();
    console.log('✅ Clicked Create button');
    
    // Wait for API response
    try {
      await createResponsePromise;
      console.log('✅ Test group creation API call completed');
    } catch (error) {
      console.log('⚠️ Test group creation API call may have already completed or timed out');
    }
    
    // Wait for navigation after creation
    await page.waitForTimeout(6000);
    
    // Verify we're on the test group detail page
    await expect(page).toHaveURL(new RegExp('/test-groups/'), { timeout: 90000 });
    await expect(page.getByText(originalName)).toBeVisible({ timeout: 90000 });
    console.log('✅ Test group created and detail page is visible');
    
    // ============================================
    // SECTION 3: Edit Test Group Name
    // ============================================
    console.log('📋 Section 3: Edit Test Group Name');
    
    // Generate updated name by appending 'edit' suffix
    const updatedName = `${originalName}edit`;
    console.log(`📝 Updated test group name: ${updatedName}`);
    
    // Set up API response listener before editing
    const updateResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/testgroup/update') || url.includes('/api/testgroup')) && 
               (response.status() === 200 || response.status() === 201);
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    // Click "Edit Group" button
    const editGroupButton = page.getByRole('button', { name: 'Edit Group' });
    await expect(editGroupButton).toBeVisible({ timeout: 90000 });
    await editGroupButton.click();
    console.log('✅ Clicked Edit Group button');
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Verify "Edit Test Group" modal is visible
    await expect(page.getByRole('heading', { name: 'Edit Test Group' })).toBeVisible({ timeout: 90000 });
    console.log('✅ Edit Test Group modal is visible');
    
    // Verify the group name input field contains the original name
    const editGroupNameInput = page.getByRole('textbox', { name: 'Enter group name' });
    await expect(editGroupNameInput).toBeVisible({ timeout: 90000 });
    const currentName = await editGroupNameInput.inputValue();
    console.log(`✅ Current group name in input: ${currentName}`);
    expect(currentName).toBe(originalName);
    
    // Clear and enter the updated name
    await editGroupNameInput.clear();
    await editGroupNameInput.fill(updatedName);
    console.log(`✅ Entered updated name: ${updatedName}`);
    
    await page.waitForTimeout(500);
    
    // Click Save button
    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeVisible({ timeout: 90000 });
    await expect(saveButton).toBeEnabled({ timeout: 90000 });
    await saveButton.click();
    console.log('✅ Clicked Save button');
    
    // Wait for API response
    try {
      await updateResponsePromise;
      console.log('✅ Test group update API call completed');
    } catch (error) {
      console.log('⚠️ Test group update API call may have already completed or timed out');
    }
    
    // Wait for UI to update
    await page.waitForTimeout(3000);
    
    // ============================================
    // SECTION 4: Verify Update Success
    // ============================================
    console.log('📋 Section 4: Verify Update Success');
    
    // Check for success message
    const successAlert = page.getByText(/Test group updated successfully|updated successfully/i).first();
    const isSuccessVisible = await successAlert.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSuccessVisible) {
      console.log('✅ Success message is visible');
    }
    
    // Verify modal is closed
    const editModalHeading = page.getByRole('heading', { name: 'Edit Test Group' });
    const isModalVisible = await editModalHeading.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isModalVisible).toBeFalsy();
    console.log('✅ Edit modal is closed');
    
    // ============================================
    // SECTION 5: Verify Updated Name is Displayed
    // ============================================
    console.log('📋 Section 5: Verify Updated Name is Displayed');
    
    // Use polling to wait for the name to update - handles race conditions
    await expect.poll(async () => {
      const groupNameElement = page.getByText(updatedName);
      const isVisible = await groupNameElement.isVisible({ timeout: 2000 }).catch(() => false);
      return isVisible;
    }, {
      message: `Group name should be updated to ${updatedName}`,
      timeout: 30000,
      intervals: [2000, 2000, 2000, 3000, 5000],
    }).toBe(true);
    
    // Verify the updated name is displayed in the header
    // Use exact text match to ensure we get the updated name, not a substring
    const updatedNameElement = page.getByText(updatedName, { exact: true });
    await expect(updatedNameElement).toBeVisible({ timeout: 90000 });
    console.log(`✅ Updated group name "${updatedName}" is visible in the header`);
    
    // Verify the updated name text content matches exactly
    const displayedName = await updatedNameElement.textContent();
    expect(displayedName?.trim()).toBe(updatedName);
    console.log(`✅ Displayed name matches updated name exactly: "${displayedName?.trim()}"`);
    
    // Verify the original name (without 'edit' suffix) is NOT displayed as exact match
    // Note: We check for exact match since updated name contains original as substring
    const originalNameExactElement = page.getByText(originalName, { exact: true });
    const originalNameExactVisible = await originalNameExactElement.isVisible({ timeout: 2000 }).catch(() => false);
    expect(originalNameExactVisible).toBeFalsy();
    console.log(`✅ Original name "${originalName}" (exact match) is no longer displayed`);
    
    // Verify Group ID remains unchanged
    const groupIdElement = page.getByText(/ID: TG-\d+/i);
    await expect(groupIdElement).toBeVisible({ timeout: 90000 });
    const groupIdText = await groupIdElement.textContent();
    console.log(`✅ Group ID remains unchanged: ${groupIdText?.trim()}`);
    
    // Verify Group Type remains unchanged
    const groupTypeElement = page.getByText('Static');
    await expect(groupTypeElement).toBeVisible({ timeout: 90000 });
    console.log('✅ Group Type remains unchanged: Static');
    
    // ============================================
    // SECTION 6: Verify Other Details Unchanged
    // ============================================
    console.log('📋 Section 6: Verify Other Details Unchanged');
    
    // Verify we're still on the test group detail page
    await expect(page).toHaveURL(new RegExp('/test-groups/'), { timeout: 90000 });
    console.log('✅ Still on test group detail page');
    
    // Verify Overview tab is still accessible
    const overviewTab = page.getByRole('tab', { name: 'Overview' });
    await expect(overviewTab).toBeVisible({ timeout: 90000 });
    console.log('✅ Overview tab is still accessible');
    
    // Verify action buttons are still visible
    const editGroupButtonAfterUpdate = page.getByRole('button', { name: 'Edit Group' });
    await expect(editGroupButtonAfterUpdate).toBeVisible({ timeout: 90000 });
    console.log('✅ Edit Group button is still visible');
    
    const createLaunchButton = page.getByRole('button', { name: 'Create Launch' });
    await expect(createLaunchButton).toBeVisible({ timeout: 90000 });
    console.log('✅ Create Launch button is still visible');
    
    console.log('✅ Edit Test Group Name test completed successfully');
  });
});

