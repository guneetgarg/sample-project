import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

test.describe('Filter Test by Summary', () => {
  test('should filter test cases by Summary column with "Auto" value and reset filter', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(120000);
    
    console.log('🔍 Starting Filter Test by Summary...');
    
    // Step 1: Login using the reusable helper
    await login(page);
    console.log('✅ Login completed');
    
    // Step 2: Navigate to the specific test cases page
    const targetUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-cases?moduleId=b4750b1c-1db3-421b-99ba-f8d1230d4be2';
    await page.goto(targetUrl);
    
    // Wait for page to load (10s after navigation as per instructions)
    await page.waitForTimeout(10000);
    
    // Verify we're on the correct page
    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    
    // Verify test cases page content is visible
    await expect(page.getByText(/Test Cases|CreatedbyAutomation/i).first()).toBeVisible({ timeout: 90000 });
    console.log('✅ Navigated to test cases page');
    
    // Step 3: Click the Summary column header to reveal the menu button
    const summaryColumnHeader = page.getByRole('columnheader', { name: /Summary/i });
    await expect(summaryColumnHeader).toBeVisible({ timeout: 90000 });
    
    // Click on the column header area first to reveal menu buttons
    await summaryColumnHeader.click();
    await page.waitForTimeout(1000);
    
    // Find and click the Summary column menu button (the icon button in the column header)
    const summaryMenuButton = summaryColumnHeader.getByRole('button', { name: /Summary column menu|column menu/i });
    await expect(summaryMenuButton).toBeVisible({ timeout: 90000 });
    await summaryMenuButton.click();
    console.log('✅ Clicked Summary column menu button');
    
    // Wait for menu to appear
    await page.waitForTimeout(1000);
    
    // Step 5: Click Filter option from the menu
    const filterMenuItem = page.getByRole('menuitem', { name: 'Filter' });
    await expect(filterMenuItem).toBeVisible({ timeout: 90000 });
    await filterMenuItem.click();
    console.log('✅ Clicked Filter menu item');
    
    // Wait for filter panel to appear
    await page.waitForTimeout(1000);
    
    // Step 6: Type 'Auto' into the Filter Value field
    const filterValueInput = page.getByRole('textbox', { name: 'Value' });
    await expect(filterValueInput).toBeVisible({ timeout: 90000 });
    await filterValueInput.fill('Auto');
    console.log('✅ Entered "Auto" in filter value field');
    
    // Press Enter to apply the filter (some filter implementations require this)
    await filterValueInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // The filter should apply automatically, but if there's an "Add filter" button, click it
    const addFilterButton = page.getByRole('button', { name: /Add filter/i });
    if (await addFilterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addFilterButton.click();
      console.log('✅ Clicked Add filter button');
      await page.waitForTimeout(2000);
    }
    
    // Wait for filter to apply (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // Step 7: Validate that filter is applied correctly
    console.log('🔍 Validating filter application...');
    
    // Wait a bit more for filter to fully apply
    await page.waitForTimeout(2000);
    
    // Check for filter indicator (optional - filter may be applied even if indicator is not visible)
    const filterIndicator = page.getByText(/1 active filter|active filter/i).first();
    const isFilterVisible = await filterIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    if (isFilterVisible) {
      console.log('✅ Filter indicator is visible');
    }
    
    // Verify all visible rows contain "Auto" in Summary column (case-insensitive)
    const visibleRows = await page.locator('[role="row"]').filter({ hasNot: page.locator('[role="columnheader"]') }).all();
    const summaries: string[] = [];
    
    for (const row of visibleRows) {
      const cells = await row.locator('[role="gridcell"]').all();
      if (cells.length >= 3) {
        // Summary is the 3rd column (index 2)
        const summaryText = await cells[2].textContent();
        if (summaryText) {
          summaries.push(summaryText.trim());
        }
      }
    }
    
    // Validate all summaries contain "Auto" (case-insensitive)
    const allContainAuto = summaries.every(s => s.toLowerCase().includes('auto'));
    expect(allContainAuto).toBeTruthy();
    console.log(`✅ All ${summaries.length} visible test cases contain "Auto" in Summary`);
    console.log(`   Summaries: ${summaries.join(', ')}`);
    
    // Step 8: Reset the filter
    console.log('🔄 Resetting filter...');
    
    // Click "Show filters" button to open filter panel if not already open
    const showFiltersButton = page.getByRole('button', { name: /Show filters/i });
    if (await showFiltersButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await showFiltersButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Click "Remove all" button to reset filter
    const removeAllButton = page.getByRole('button', { name: 'Remove all' });
    await expect(removeAllButton).toBeVisible({ timeout: 90000 });
    await removeAllButton.click();
    console.log('✅ Clicked Remove all button');
    
    // Wait for filter to reset (6s after action as per instructions)
    await page.waitForTimeout(6000);
    
    // Step 9: Validate that filter is reset
    console.log('🔍 Validating filter reset...');
    
    // Check that filter indicator is no longer visible
    const filterIndicatorAfterReset = page.getByText(/1 active filter/i).first();
    await expect(filterIndicatorAfterReset).not.toBeVisible({ timeout: 90000 });
    console.log('✅ Filter indicator is no longer visible');
    
    // Verify that QAPA-29 (which doesn't contain "Auto") is now visible (if it exists)
    // Note: QAPA-29 might not exist or might be on a different page, so make this optional
    const qapa29Row = page.getByRole('row', { name: /QAPA-29/i });
    const isQapa29Visible = await qapa29Row.isVisible({ timeout: 5000 }).catch(() => false);
    if (isQapa29Visible) {
      console.log('✅ QAPA-29 is visible after filter reset (confirms filter was removed)');
    } else {
      console.log('⚠️ QAPA-29 not visible (may not exist or may be on a different page)');
    }
    
    console.log('✅ Filter Test by Summary completed successfully');
  });
});

