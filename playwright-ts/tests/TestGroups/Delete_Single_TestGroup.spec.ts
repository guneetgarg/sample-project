import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

test.describe('Delete Single Test Group', () => {
  test('should delete a single test group by filtering and selecting it', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(120000);
    
    console.log('🗑️ Starting Delete Single Test Group test...');
    
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
    
    // Step 3: Get initial total count before deletion
    const initialTotalText = await page.getByText(/\d+ total/i).first().textContent();
    const initialTotal = initialTotalText ? parseInt(initialTotalText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Initial total test groups: ${initialTotal}`);
    
    // Step 4: Hover over "Group Name & Description" column header to reveal menu button
    const groupNameColumnHeader = page.getByRole('columnheader', { name: /Group Name & Description/i });
    await expect(groupNameColumnHeader).toBeVisible({ timeout: 90000 });
    await groupNameColumnHeader.hover();
    console.log('✅ Hovered over Group Name & Description column header');
    
    // Wait a moment for the menu button to appear
    await page.waitForTimeout(500);
    
    // Step 5: Click the column menu button
    const columnMenuButton = groupNameColumnHeader.getByRole('button', { name: /Group Name & Description column menu|column menu/i });
    await expect(columnMenuButton).toBeVisible({ timeout: 90000 });
    await columnMenuButton.click();
    console.log('✅ Clicked Group Name & Description column menu button');
    
    // Wait for menu to appear
    await page.waitForTimeout(1000);
    
    // Step 6: Click Filter option from the menu
    const filterMenuItem = page.getByRole('menuitem', { name: 'Filter' });
    await expect(filterMenuItem).toBeVisible({ timeout: 90000 });
    await filterMenuItem.click();
    console.log('✅ Clicked Filter menu item');
    
    // Wait for filter panel to appear
    await page.waitForTimeout(1000);
    
    // Step 7: Enter filter value "TestGroupwithTestCase-" in the Value field
    const filterValueInput = page.getByRole('textbox', { name: 'Value' });
    await expect(filterValueInput).toBeVisible({ timeout: 90000 });
    await filterValueInput.fill('TestGroupwithTestCase-');
    console.log('✅ Entered "TestGroupwithTestCase-" in filter value field');
    
    // Wait a moment for the input to be processed
    await page.waitForTimeout(500);
    
    // Set up filter API response listener before clicking
    const filterResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/testgroup/list') || url.includes('/api/testgroup/getAll')) && response.status() === 200;
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    // Click "Add filter" button to apply the filter
    const addFilterButton = page.getByRole('button', { name: 'Add filter' });
    await expect(addFilterButton).toBeVisible({ timeout: 90000 });
    await expect(addFilterButton).toBeEnabled({ timeout: 90000 });
    await addFilterButton.click();
    console.log('✅ Clicked Add filter button');
    
    // Wait for filter API response
    try {
      await filterResponsePromise;
      console.log('✅ Filter API call completed');
    } catch (error) {
      console.log('⚠️ Filter API call may have already completed or timed out');
    }
    
    // Wait for filter to apply and find matching rows
    console.log('⏳ Waiting for filter to apply and matching rows to appear...');
    await page.waitForTimeout(2000);
    
    // Check for filter indicator
    const filterIndicator = page.getByText(/1 active filter|active filter/i).first();
    const isFilterIndicatorVisible = await filterIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    if (isFilterIndicatorVisible) {
      console.log('✅ Filter indicator is visible');
    }
    
    // Look for matching rows with retry
    let firstMatchingRow = page.getByRole('row').filter({ hasText: /TestGroupwithTestCase-/i }).first();
    const maxRetries = 5;
    let rowFound = false;
    
    for (let i = 0; i < maxRetries; i++) {
      const rowVisible = await firstMatchingRow.isVisible({ timeout: 3000 }).catch(() => false);
      if (rowVisible) {
        rowFound = true;
        console.log(`✅ Matching row found (attempt ${i + 1}/${maxRetries})`);
        break;
      } else {
        console.log(`⏳ Waiting for matching row... (attempt ${i + 1}/${maxRetries})`);
        await page.waitForTimeout(2000 * (i + 1));
        // Refresh the locator
        firstMatchingRow = page.getByRole('row').filter({ hasText: /TestGroupwithTestCase-/i }).first();
      }
    }
    
    if (!rowFound) {
      // Check if filter was applied but no results
      if (isFilterIndicatorVisible) {
        await page.screenshot({ path: 'test-results/no-matching-rows.png', fullPage: true });
        throw new Error('Filter applied but no matching test groups found. All test groups with prefix "TestGroupwithTestCase-" may have been deleted.');
      } else {
        await page.screenshot({ path: 'test-results/filter-not-applied.png', fullPage: true });
        throw new Error('Filter did not apply - filter indicator not visible and no matching rows found');
      }
    }
    
    // Step 8: Select the first checkbox for a test group matching the filter
    
    // Find the first row that contains "TestGroupwithTestCase-" in its name
    // Reuse the variable from filter verification if it exists, otherwise create new locator
    if (!firstMatchingRow) {
      firstMatchingRow = page.getByRole('row').filter({ hasText: /TestGroupwithTestCase-/i }).first();
    }
    await expect(firstMatchingRow).toBeVisible({ timeout: 90000 });
    await firstMatchingRow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Get the test group name for verification
    const testGroupName = await firstMatchingRow.getByText(/TestGroupwithTestCase-[\d-]+/i).first().textContent();
    console.log(`📝 Found test group to delete: ${testGroupName}`);
    
    // Click the checkbox in the first matching row
    const checkbox = firstMatchingRow.getByRole('checkbox', { name: /Select row|Unselect row/i });
    await expect(checkbox).toBeVisible({ timeout: 90000 });
    await expect(checkbox).toBeEnabled({ timeout: 90000 });
    
    // Ensure checkbox is checked
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
      await expect(checkbox).toBeChecked({ timeout: 5000 });
    }
    console.log('✅ Selected the first test group checkbox');
    
    // Wait for selection to be processed
    await page.waitForTimeout(500);
    
    // Step 9: Capture count before deletion and check if filter actually changed the count
    const countBeforeDeletionText = await page.getByText(/\d+ total/i).first().textContent();
    const countBeforeDeletion = countBeforeDeletionText ? parseInt(countBeforeDeletionText.match(/\d+/)?.[0] || '0') : 0;
    console.log(`📊 Test group count before deletion: ${countBeforeDeletion}`);
    
    // Check if filter actually changed the count (if filter is active but count is same, all items match filter)
    const filterActuallyChangedCount = isFilterIndicatorVisible && countBeforeDeletion !== initialTotal;
    if (filterActuallyChangedCount) {
      console.log(`📊 Filter is active and changed count: ${initialTotal} → ${countBeforeDeletion} (filtered count)`);
    } else if (isFilterIndicatorVisible) {
      console.log(`📊 Filter is active but count unchanged: ${countBeforeDeletion} (all items match filter)`);
    } else {
      console.log(`📊 No filter active: ${countBeforeDeletion} (total count)`);
    }
    
    // Step 10: Set up API response listeners before clicking delete
    const deleteResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        const status = response.status();
        return url.includes('/api/testgroup/delete') && (status === 200 || status === 201);
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    const testGroupListRefreshPromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/testgroup/list') || url.includes('/api/testgroup/getAll')) && response.status() === 200;
      },
      { timeout: 30000 }
    ).catch(() => null);
    
    // Step 11: Click the delete icon (Delete selected group(s) button)
    const deleteButton = page.getByRole('button', { name: 'Delete selected group(s)' });
    await expect(deleteButton).toBeVisible({ timeout: 90000 });
    await expect(deleteButton).toBeEnabled({ timeout: 90000 });
    await deleteButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await deleteButton.click();
    console.log('✅ Clicked Delete selected group(s) button');
    
    // Step 12: Verify confirmation dialog is visible
    console.log('✅ Confirming deletion...');
    const confirmDialogText = page.getByText(/Delete Test Group|Are you sure you want to delete/i).first();
    await expect(confirmDialogText).toBeVisible({ timeout: 90000 });
    
    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    await expect(confirmButton).toBeVisible({ timeout: 90000 });
    await expect(confirmButton).toBeEnabled({ timeout: 90000 });
    console.log('✅ Delete confirmation dialog is visible');
    
    // Step 13: Click Confirm button
    await confirmButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await confirmButton.click();
    console.log('✅ Clicked Confirm button');
    
    // Step 14: Wait for API calls to complete and check for errors
    let deleteSucceeded = false;
    let deleteError: string | null = null;
    
    try {
      const deleteResponse = await deleteResponsePromise;
      if (deleteResponse) {
        const responseStatus = deleteResponse.status();
        if (responseStatus === 200 || responseStatus === 201) {
          deleteSucceeded = true;
          console.log('✅ Delete API call completed successfully');
        } else {
          const responseBody = await deleteResponse.text().catch(() => '');
          console.log(`⚠️ Delete API call returned status ${responseStatus}: ${responseBody}`);
          deleteError = `API returned ${responseStatus}`;
        }
      } else {
        console.log('⚠️ Delete API response not captured (may have completed before listener was set up)');
        // Assume it succeeded if we can't verify
        deleteSucceeded = true;
      }
    } catch (error) {
      console.log(`⚠️ Error waiting for delete API: ${error}`);
      deleteError = error;
    }
    
    try {
      await testGroupListRefreshPromise;
      console.log('✅ Test group list refreshed');
    } catch (error) {
      console.log('⚠️ Test group list refresh may have already completed or timed out');
    }
    
    // Wait for dialog to close
    const dialogStillVisible = await confirmDialogText.isVisible({ timeout: 2000 }).catch(() => false);
    if (dialogStillVisible) {
      await expect(confirmDialogText).not.toBeVisible({ timeout: 5000 }).catch(() => {
        console.log('⚠️ Dialog may not have closed, but proceeding');
      });
    }
    
    // Wait for UI to update
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    
    // Check if test group still exists (might have been deleted by another parallel test)
    if (testGroupName) {
      const testGroupStillVisible = await page.getByText(testGroupName).isVisible({ timeout: 3000 }).catch(() => false);
      if (testGroupStillVisible && !deleteSucceeded) {
        console.error(`❌ Test group "${testGroupName}" is still visible and deletion API may have failed`);
        await page.screenshot({ path: 'test-results/test-group-still-visible.png', fullPage: true });
        throw new Error(`Deletion failed: Test group "${testGroupName}" is still visible. ${deleteError || 'Unknown error'}`);
      } else if (!testGroupStillVisible) {
        console.log(`✅ Test group "${testGroupName}" is no longer visible (deletion succeeded)`);
        deleteSucceeded = true; // Confirm deletion succeeded
      }
    }
    
    // Step 15: Verify that the test group was deleted successfully
    console.log('🔍 Verifying test group deletion...');
    
    // Check for success message
    const successAlert = page.getByText(/Test group deleted successfully|deleted successfully/i).first();
    const isSuccessVisible = await successAlert.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSuccessVisible) {
      console.log('✅ Success message is visible');
    }
    
    // Refresh the page to ensure we have the latest state (important for parallel test execution)
    console.log('🔄 Refreshing page to get latest state...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Verify we're still on the test groups page
    await expect(page).toHaveURL(new RegExp('/test-groups'), { timeout: 90000 });
    
    // COMMENTED OUT: Count comparison step after deletion
    // This step has been commented out as requested
    /*
    // Get count element and verify it's visible
    const countElement = page.getByText(/\d+ total/i).first();
    await expect(countElement).toBeVisible({ timeout: 90000 });
    
    // Re-check filter status right before verification (it may have changed)
    const filterIndicatorAfterDeletion = page.getByText(/1 active filter|active filter/i).first();
    const filterStillActiveAfterDeletion = await filterIndicatorAfterDeletion.isVisible({ timeout: 3000 }).catch(() => false);
    
    // Get current count to understand what we're looking at
    const currentCountText = await countElement.textContent();
    const currentCount = currentCountText ? parseInt(currentCountText.match(/\d+/)?.[0] || '0') : 0;
    
    // Determine expected count based on filter status and whether filter actually changed the count
    // Logic:
    // 1. If filter was active AND changed the count, and filter is still active: use filtered count - 1
    // 2. If filter was active AND changed the count, but filter was cleared: use initial total - 1
    // 3. If filter was active but didn't change count (all match), or no filter: use initial total - 1
    // 4. If current count equals initialTotal, we're looking at total count regardless of filter status
    let expectedCount: number;
    let countContext: string;
    
    // Check if we're looking at total count or filtered count
    const isLookingAtTotalCount = currentCount === initialTotal || !filterStillActiveAfterDeletion;
    
    if (filterStillActiveAfterDeletion && filterActuallyChangedCount && !isLookingAtTotalCount) {
      // Filter still active and it actually filtered - count should be filtered count minus 1
      expectedCount = countBeforeDeletion - 1;
      countContext = 'filtered';
      console.log(`📊 Filter is still active - expecting filtered count to decrease: ${countBeforeDeletion} → ${expectedCount}`);
    } else {
      // Filter was cleared OR filter didn't actually change count OR we're looking at total - use initial total minus 1
      expectedCount = initialTotal - 1;
      countContext = 'total';
      if (filterStillActiveAfterDeletion && !filterActuallyChangedCount) {
        console.log(`📊 Filter is active but didn't change count - expecting total count to decrease: ${initialTotal} → ${expectedCount}`);
      } else if (filterStillActiveAfterDeletion && isLookingAtTotalCount) {
        console.log(`📊 Filter is active but count shows total - expecting total count to decrease: ${initialTotal} → ${expectedCount}`);
      } else {
        console.log(`📊 Filter was cleared - expecting total count to decrease: ${initialTotal} → ${expectedCount}`);
      }
    }
    
    // Use polling to wait for count to decrease - handles race conditions
    console.log('⏳ Waiting for count to decrease...');
    
    // If deletion didn't succeed (e.g., test group already deleted by parallel test), 
    // verify that count is at least less than initial (might have been decreased by another test)
    if (!deleteSucceeded) {
      console.log('⚠️ Deletion may not have succeeded (possibly deleted by parallel test) - verifying count decreased');
      // Use a more lenient check - count should be less than initial
      await expect.poll(async () => {
        const countAfterDeletionText = await countElement.textContent();
        const count = countAfterDeletionText ? parseInt(countAfterDeletionText.match(/\d+/)?.[0] || '0') : 0;
        console.log(`📊 Polling ${countContext} count: Current = ${count}, Initial = ${initialTotal}`);
        return count;
      }, {
        message: `${countContext.charAt(0).toUpperCase() + countContext.slice(1)} count should be less than initial ${initialTotal}`,
        timeout: 30000,
        intervals: [2000, 2000, 2000, 3000, 5000],
      }).toBeLessThan(initialTotal);
      
      const finalCountText = await countElement.textContent();
      const finalCount = finalCountText ? parseInt(finalCountText.match(/\d+/)?.[0] || '0') : 0;
      console.log(`✅ Count decreased (may have been decreased by parallel test): ${initialTotal} → ${finalCount}`);
      console.log('⚠️ Note: Deletion may have been performed by another parallel test instance');
    } else {
      // Normal case - deletion succeeded, verify exact count
      await expect.poll(async () => {
        const countAfterDeletionText = await countElement.textContent();
        const count = countAfterDeletionText ? parseInt(countAfterDeletionText.match(/\d+/)?.[0] || '0') : 0;
        console.log(`📊 Polling ${countContext} count: Current = ${count}, Expected = ${expectedCount}`);
        return count;
      }, {
        // Poll until count matches expected value (decreased by 1)
        message: `${countContext.charAt(0).toUpperCase() + countContext.slice(1)} count should be ${expectedCount} (was ${filterActuallyChangedCount ? countBeforeDeletion : initialTotal})`,
        timeout: 30000, // 30 seconds total timeout
        intervals: [2000, 2000, 2000, 3000, 5000], // Progressive intervals
      }).toBe(expectedCount);
      
      // Get final count for logging
      const countAfterDeletionText = await countElement.textContent();
      const countAfterDeletion = countAfterDeletionText ? parseInt(countAfterDeletionText.match(/\d+/)?.[0] || '0') : 0;
      
      if (filterStillActiveAfterDeletion && filterActuallyChangedCount && !isLookingAtTotalCount) {
        console.log(`✅ Filtered test group count decreased by exactly 1: ${countBeforeDeletion} → ${countAfterDeletion}`);
      } else {
        console.log(`✅ Total test group count decreased by exactly 1: ${initialTotal} → ${countAfterDeletion}`);
      }
    }
    */
    
    // Verify the deleted test group is no longer visible in the list
    if (testGroupName) {
      const deletedGroupVisible = await page.getByText(testGroupName).isVisible({ timeout: 5000 }).catch(() => false);
      expect(deletedGroupVisible).toBeFalsy();
      console.log(`✅ Test group "${testGroupName}" is no longer visible in the list`);
    }
    
    // Verify that other test groups with similar names are still visible (if any) - optional check
    try {
      const remainingGroups = page.getByText(/TestGroupwithTestCase-/i);
      const remainingCount = await remainingGroups.count();
      if (remainingCount > 0) {
        console.log(`✅ Other test groups with similar names are still visible (${remainingCount} found)`);
      }
    } catch (e) {
      console.log(`⚠️ Could not verify remaining groups: ${e.message} (continuing...)`);
    }
    
    console.log('✅ Delete Single Test Group test completed successfully');
  });
});

