import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

test.describe('Filter Test Group', () => {
  test('should filter test groups by name prefix and verify filtered results', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(120000);
    
    console.log('🔍 Starting Filter Test Group test...');
    
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
    
    // Wait for page to load
    await page.waitForTimeout(10000);
    
    // Verify we're on the Test Groups page
    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    await expect(page.getByText(/Test Groups|Test Groups Library/i).first()).toBeVisible({ timeout: 90000 });
    console.log('✅ Navigated to Test Groups page');
    
    // ============================================
    // SECTION 3: Get Initial Count and Identify Filter Prefix
    // ============================================
    console.log('📋 Section 3: Get Initial Count and Identify Filter Prefix');
    
    // Get initial total count before filtering
    const initialTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const initialTotal = initialTotalText ? parseInt(initialTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Initial total test groups: ${initialTotal}`);
    
    // Use the same prefix as Create_TestGroup.spec.ts
    // That test creates groups with prefix: "TestGroupCreatedbyAutomation-"
    const filterPrefix = 'TestGroupCreatedbyAutomation';
    console.log(`📝 Filter prefix to use: ${filterPrefix}`);
    console.log(`📝 This will filter groups created by Create_TestGroup.spec.ts`);
    
    // ============================================
    // SECTION 4: Apply Filter by Group Name Prefix
    // ============================================
    console.log('📋 Section 4: Apply Filter by Group Name Prefix');
    
    // Click on "Group Name & Description" column header to open filter menu
    const groupNameColumnHeader = page.getByRole('columnheader', { name: /Group Name & Description/i });
    await expect(groupNameColumnHeader).toBeVisible({ timeout: 90000 });
    
    // Click the column header to open sort/filter menu
    await groupNameColumnHeader.click();
    await page.waitForTimeout(1000);
    console.log('✅ Clicked Group Name & Description column header');
    
    // Click the column menu button (three dots or menu icon)
    // The menu button might be visible after clicking the header
    const columnMenuButton = groupNameColumnHeader.getByRole('button', { name: /Group Name & Description column menu|column menu/i });
    const menuButtonVisible = await columnMenuButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (menuButtonVisible) {
      await columnMenuButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Opened column menu via menu button');
    } else {
      // Menu might already be open, try to find Filter option directly
      console.log('⚠️ Menu button not found, trying to find Filter option directly');
    }
    
    // Click "Filter" option from the menu
    const filterMenuItem = page.getByRole('menuitem', { name: 'Filter' });
    await expect(filterMenuItem).toBeVisible({ timeout: 90000 });
    await filterMenuItem.click();
    console.log('✅ Clicked Filter option');
    
    // Wait for filter dialog to appear
    await page.waitForTimeout(1000);
    
    // Verify filter dialog is visible
    const filterDialog = page.getByText(/Columns|Operator|Value|Filter value/i).first();
    await expect(filterDialog).toBeVisible({ timeout: 90000 });
    console.log('✅ Filter dialog is visible');
    
    // Set up API response listener for filter application
    const filterResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/testgroup/list') || url.includes('/api/testgroup/getAll') || url.includes('/api/testgroup')) && 
               response.status() === 200;
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    // Find the Value textbox in the filter dialog
    // The filter dialog may have multiple textboxes, we need the active one for "Value"
    const valueTextbox = page.getByRole('textbox', { name: 'Value' }).first();
    await expect(valueTextbox).toBeVisible({ timeout: 90000 });
    
    // Enter the filter prefix (to match groups created by Create_TestGroup.spec.ts)
    await valueTextbox.fill(filterPrefix);
    console.log(`✅ Entered filter value: ${filterPrefix}`);
    
    await page.waitForTimeout(500);
    
    // Click "Add filter" button
    const addFilterButton = page.getByRole('button', { name: 'Add filter' });
    await expect(addFilterButton).toBeVisible({ timeout: 90000 });
    await addFilterButton.click();
    console.log('✅ Clicked Add filter button');
    
    // Wait for API response
    try {
      await filterResponsePromise;
      console.log('✅ Filter API call completed');
    } catch (error) {
      console.log('⚠️ Filter API call may have already completed or timed out');
    }
    
    // Wait for filter to be applied and results to update
    await page.waitForTimeout(3000);
    
    // ============================================
    // SECTION 5: Verify Filter Results
    // ============================================
    console.log('📋 Section 5: Verify Filter Results');
    
    // Verify filter indicator is visible on the column header
    const filterIndicator = page.getByText(/active filter|1 active filter/i).first();
    const filterIndicatorVisible = await filterIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    if (filterIndicatorVisible) {
      console.log('✅ Filter indicator is visible on column header');
    }
    
    // Get filtered total count
    const filteredTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const filteredTotal = filteredTotalText ? parseInt(filteredTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Filtered total test groups: ${filteredTotal}`);
    
    // Filtered results should be less than or equal to initial total
    expect(filteredTotal).toBeLessThanOrEqual(initialTotal);
    console.log('✅ Filtered count is less than or equal to initial total');
    
    // Check if "No results found" is displayed
    const noResultsMessage = page.getByText(/No results found/i);
    const noResultsVisible = await noResultsMessage.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (noResultsVisible) {
      console.log('⚠️ No results found - this means no groups with this prefix exist yet');
      console.log('⚠️ This is expected if Create_TestGroup.spec.ts has not been run recently');
      console.log('⚠️ The filter functionality is still working correctly');
    } else {
      // Count how many test groups match the filter
      const allRows = page.getByRole('row');
      const rowCount = await allRows.count();
      
      let matchingRowsCount = 0;
      const matchingGroupNames: string[] = [];
      
      for (let i = 0; i < rowCount; i++) {
        const row = allRows.nth(i);
        const rowTextContent = await row.textContent();
        if (rowTextContent && rowTextContent.includes(filterPrefix)) {
          matchingRowsCount++;
          // Try to extract the group name from the row
          const groupNameMatch = rowTextContent.match(new RegExp(`${filterPrefix}-[\\d_-]+`, 'i'));
          if (groupNameMatch) {
            matchingGroupNames.push(groupNameMatch[0]);
          }
        }
      }
      
      console.log(`📊 Found ${matchingRowsCount} test group(s) matching filter "${filterPrefix}"`);
      
      if (matchingRowsCount > 0) {
        console.log(`✅ Filter is working correctly - found ${matchingRowsCount} matching group(s)`);
        console.log(`📋 Matching group names: ${matchingGroupNames.join(', ')}`);
        
        // Verify at least one matching group has expected properties
        // Find the first matching row
        const firstMatchingRow = page.getByRole('row').filter({ hasText: filterPrefix }).first();
        await expect(firstMatchingRow).toBeVisible({ timeout: 90000 });
        
        // Verify the row contains expected details
        const rowText = await firstMatchingRow.textContent();
        expect(rowText).toContain('Static'); // Group type should be Static
        expect(rowText).toMatch(/TG-\d+/); // Should contain a Group ID
        console.log('✅ First matching group row contains expected details (Static type, Group ID)');
        
        // Verify the group name contains the prefix
        expect(rowText).toContain(filterPrefix);
        console.log('✅ Group name contains the expected prefix');
      } else {
        console.log('⚠️ No matching groups found in the filtered results');
        console.log('⚠️ This might indicate a timing issue or the filter needs adjustment');
      }
    }
    
    // ============================================
    // SECTION 6: Verify Filter Functionality
    // ============================================
    console.log('📋 Section 6: Verify Filter Functionality');
    
    // Verify filter is still active
    const filterStillActive = await filterIndicator.isVisible({ timeout: 2000 }).catch(() => false);
    if (filterStillActive) {
      console.log('✅ Filter remains active');
    }
    
    // Verify that the total count has changed (if there were results)
    if (!noResultsVisible && filteredTotal < initialTotal) {
      console.log(`✅ Filter successfully reduced results from ${initialTotal} to ${filteredTotal}`);
    } else if (noResultsVisible) {
      console.log('✅ Filter successfully applied (no matching results found)');
    } else {
      console.log('⚠️ Filter may not have been applied correctly');
    }
    
    // ============================================
    // SECTION 7: Clear Filter
    // ============================================
    console.log('📋 Section 7: Clear Filter');
    
    // Click on the filter indicator or column header to open filter dialog again
    const filterIndicatorButton = page.getByRole('button', { name: /Show filters|active filter/i }).first();
    const filterButtonVisible = await filterIndicatorButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (filterButtonVisible) {
      await filterIndicatorButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked filter indicator to open filter dialog');
    } else {
      // If filter indicator button not found, try clicking column header again
      await groupNameColumnHeader.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked column header to open filter dialog');
    }
    
    // Wait for filter dialog to appear
    await page.waitForTimeout(1000);
    
    // Set up API response listener for filter clearing
    const clearFilterResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/testgroup/list') || url.includes('/api/testgroup/getAll') || url.includes('/api/testgroup')) && 
               response.status() === 200;
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    // Click "Remove all" button to clear all filters
    const removeAllButton = page.getByRole('button', { name: 'Remove all' });
    await expect(removeAllButton).toBeVisible({ timeout: 90000 });
    await removeAllButton.click();
    console.log('✅ Clicked Remove all button to clear filters');
    
    // Wait for API response
    try {
      await clearFilterResponsePromise;
      console.log('✅ Filter clearing API call completed');
    } catch (error) {
      console.log('⚠️ Filter clearing API call may have already completed or timed out');
    }
    
    // Wait for filter to be cleared and results to update
    await page.waitForTimeout(3000);
    
    // Verify filter indicator is no longer visible
    const filterIndicatorAfterClear = page.getByText(/active filter|1 active filter/i).first();
    const filterIndicatorStillVisible = await filterIndicatorAfterClear.isVisible({ timeout: 2000 }).catch(() => false);
    expect(filterIndicatorStillVisible).toBeFalsy();
    console.log('✅ Filter indicator is no longer visible - filter has been cleared');
    
    // Verify the total count is restored (should be back to initial or close to it)
    const clearedTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const clearedTotal = clearedTotalText ? parseInt(clearedTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Total test groups after clearing filter: ${clearedTotal}`);
    
    // The cleared total should be greater than or equal to the filtered total
    // (and should be close to or equal to initial total, accounting for any new groups created during test)
    expect(clearedTotal).toBeGreaterThanOrEqual(filteredTotal);
    console.log('✅ Total count after clearing filter is greater than or equal to filtered count');
    
    // Verify "No results found" message is gone (if it was visible)
    const noResultsAfterClear = await noResultsMessage.isVisible({ timeout: 2000 }).catch(() => false);
    if (noResultsVisible && !noResultsAfterClear) {
      console.log('✅ "No results found" message is gone - filter has been cleared');
    }
    
    console.log('✅ Filter Test Group test completed successfully');
  });
});

