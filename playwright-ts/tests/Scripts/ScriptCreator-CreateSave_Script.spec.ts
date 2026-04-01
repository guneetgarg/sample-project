import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

test.describe('Script Creator - Create and Save Script', () => {
  test('should create a script via NLP Automation and save it', async ({ page }) => {
    // Set a reasonable timeout for this test
    test.setTimeout(300000); // 5 minutes to allow for AI execution

    console.log('🤖 Starting Script Creator - Create and Save Script test...');

    // Step 1: Login using the reusable helper
    await login(page);
    console.log('✅ Login completed');

    // Step 2: Navigate to the Script Creator page for a specific test case
    const projectId = 'd7735c45-30e0-417a-806f-524b000bf75d';
    const testCaseId = 'fd0c911f-c175-41be-bac9-596b817f1591';
    const scriptCreatorUrl = `https://qa-path.com/home/projects/${projectId}/automation/${testCaseId}`;
    
    await page.goto(scriptCreatorUrl);
    console.log(`✅ Navigated to Script Creator: ${scriptCreatorUrl}`);

    // Wait for page to load (10s after navigation as per instructions)
    await page.waitForTimeout(10000);

    // Verify we're on the Script Creator page
    await expect(page).toHaveURL(new RegExp('/automation'), { timeout: 90000 });
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    
    // Wait for page content to load - look for visible elements that indicate Script Creator page
    // The "Script Creator" text might be in a hidden sidebar, so check for other visible elements
    const pageContent = page.getByText(/NLP Automation|Record Script|Interpret & Execute/i).first();
    await expect(pageContent).toBeVisible({ timeout: 90000 });
    console.log('✅ Script Creator page loaded');

    // Step 3: Click the "NLP Automation" tab if it exists (or verify we're already on it)
    // Note: The tab might already be active, so we'll check first
    const nlpTab = page.getByRole('tab', { name: /NLP Automation/i });
    const isNlpTabVisible = await nlpTab.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isNlpTabVisible) {
      await nlpTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked NLP Automation tab');
    } else {
      console.log('✅ NLP Automation tab already active or not needed');
    }

    // Step 4: Check if instruction input is already visible (Record Script button may not exist)
    console.log('📝 Checking for instruction input...');
    
    // The instruction input should be visible - if not, we might need to look for it differently
    // Check if the instruction textbox is already available
    const textboxes = page.getByRole('textbox');
    const firstInputVisible = await textboxes.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!firstInputVisible) {
      // Try to find "Record Script" button if instruction input is not visible
      const recordScriptButton = page.getByRole('button', { name: /Record Script/i });
      const buttonVisible = await recordScriptButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (buttonVisible) {
        await recordScriptButton.click();
        console.log('✅ Clicked Record Script button');
        await page.waitForTimeout(2000);
      } else {
        // Instruction input might be in a collapsed section - try to expand it
        console.log('⚠️ Instruction input not immediately visible, waiting for page to fully load...');
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('✅ Instruction input is already visible');
    }

    // Step 5: Enter the instruction into the first instruction textbox
    console.log('✍️ Entering instruction...');
    const instructionText = 'Login to qa-path.com with username as rahul@alternative-path.com and password=password';
    
    // Find the instruction input - it should be in the "AI Instruction Interpreter" section
    // Try to find textbox that's not disabled and is in the instruction area
    const instructionInputs = page.getByRole('textbox').filter({ hasNot: page.locator('[disabled]') });
    const firstInstructionInput = instructionInputs.first();
    
    await expect(firstInstructionInput).toBeVisible({ timeout: 90000 });
    await expect(firstInstructionInput).toBeEnabled({ timeout: 90000 });
    
    // Scroll into view and focus
    await firstInstructionInput.scrollIntoViewIfNeeded();
    await firstInstructionInput.click();
    await page.waitForTimeout(500);
    
    // Clear any existing text and fill with new instruction
    await firstInstructionInput.fill(instructionText);
    console.log(`✅ Entered instruction: ${instructionText}`);
    await page.waitForTimeout(500);

    // Step 6: Select model as "5.1 model"
    console.log('🔧 Selecting model...');
    
    // Wait for the model selector to be available (it might load asynchronously)
    await page.waitForTimeout(2000);
    
    // Find the model selector - look specifically in the footer area where it should be
    // Based on InstructionComponent, it's in the CommonFooter with label "Select Model"
    const modelLabel = page.getByText(/Select Model/i);
    await expect(modelLabel).toBeVisible({ timeout: 90000 });
    
    // Find the associated select/combobox/button - it should be near the label
    // Try to find it by looking for form controls near the label
    let modelSelector = modelLabel.locator('..').locator('select, [role="combobox"], button').first();
    let selectorFound = await modelSelector.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!selectorFound) {
      // Try finding by looking for the select element with the label
      modelSelector = page.locator('select, [role="combobox"]').filter({ has: modelLabel }).first();
      selectorFound = await modelSelector.isVisible({ timeout: 5000 }).catch(() => false);
    }
    
    if (!selectorFound) {
      // Try finding any select/combobox in the footer area
      const footerArea = page.locator('[class*="footer"], [class*="Footer"], [class*="selectModel"]');
      modelSelector = footerArea.locator('select, [role="combobox"], button').first();
      selectorFound = await modelSelector.isVisible({ timeout: 5000 }).catch(() => false);
    }
    
    if (!selectorFound) {
      await page.screenshot({ path: 'test-results/model-selector-not-found.png', fullPage: true });
      throw new Error('Model selector not found on the page');
    }
    
    await expect(modelSelector).toBeVisible({ timeout: 90000 });
    await modelSelector.scrollIntoViewIfNeeded();
    
    // Close any open menus/dropdowns first to avoid conflicts
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await modelSelector.click();
    console.log('✅ Clicked model selector');
    
    // Wait for the correct dropdown to appear (model options, not navigation menu)
    await page.waitForTimeout(1500);
    
    // Try to find the model options - they should be in a listbox, menu, or select options
    // First, check if we have a select element (native dropdown)
    const isSelect = await modelSelector.evaluate(el => el.tagName === 'SELECT').catch(() => false);
    
    let modelOption;
    let optionFound = false;
    
    if (isSelect) {
      // Native select - use value or text
      modelOption = modelSelector.locator('option').filter({ hasText: /5\.1|5.1/i }).first();
      optionFound = await modelOption.count().then(count => count > 0).catch(() => false);
      if (optionFound) {
        await modelSelector.selectOption({ label: /5\.1|5.1/i });
        console.log('✅ Selected 5.1 model (native select)');
        await page.waitForTimeout(1000);
      }
    } else {
      // Custom dropdown - look for options in listbox/menu
      modelOption = page.locator('[role="listbox"], [role="menu"]').getByRole('option', { name: /5\.1|5.1/i });
      optionFound = await modelOption.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (!optionFound) {
        // Try finding by text in any visible dropdown
        const dropdown = page.locator('[role="listbox"], [role="menu"], [class*="menu"], [class*="dropdown"]').filter({ hasText: /5\.1|5.1/i }).first();
        const dropdownVisible = await dropdown.isVisible({ timeout: 5000 }).catch(() => false);
        if (dropdownVisible) {
          modelOption = dropdown.getByText(/5\.1|5.1/i).first();
          optionFound = await modelOption.isVisible({ timeout: 5000 }).catch(() => false);
        }
      }
      
      if (optionFound) {
        await expect(modelOption).toBeVisible({ timeout: 90000 });
        await modelOption.scrollIntoViewIfNeeded();
        await modelOption.click();
        console.log('✅ Selected 5.1 model (custom dropdown)');
        await page.waitForTimeout(1000);
      }
    }
    
    if (!optionFound) {
      // Log all available options for debugging
      const allOptions = page.locator('[role="option"], [role="menuitem"], option, li').filter({ hasText: /.+/ });
      const optionCount = await allOptions.count();
      console.log(`📋 Found ${optionCount} total options on page`);
      
      // Log visible options
      for (let i = 0; i < Math.min(optionCount, 20); i++) {
        const option = allOptions.nth(i);
        const isVisible = await option.isVisible().catch(() => false);
        if (isVisible) {
          const optionText = await option.textContent().catch(() => '');
          console.log(`   Visible Option ${i + 1}: "${optionText}"`);
        }
      }
      
      await page.screenshot({ path: 'test-results/model-option-not-found.png', fullPage: true });
      throw new Error('5.1 model option not found. Check screenshot and console logs for available options.');
    }

    // Step 7: Click "Interpret & Execute" button
    console.log('▶️ Clicking Interpret & Execute...');
    const interpretExecuteButton = page.getByRole('button', { name: 'Interpret & Execute', exact: true });
    await expect(interpretExecuteButton).toBeVisible({ timeout: 90000 });
    await expect(interpretExecuteButton).toBeEnabled({ timeout: 90000 });
    await interpretExecuteButton.click();
    console.log('✅ Clicked Interpret & Execute button');

    // Wait for automation to start
    await page.waitForTimeout(2000);

    // Verify automation started
    const automationStartedAlert = page.getByText(/Automation started/i).first();
    const isAlertVisible = await automationStartedAlert.isVisible({ timeout: 10000 }).catch(() => false);
    if (isAlertVisible) {
      console.log('✅ Automation started alert is visible');
    }

    // Step 8: Wait for execution to complete
    console.log('⏳ Waiting for execution to complete...');
    
    // Wait for "Running" text to disappear
    const runningText = page.getByText('Running').first();
    await runningText.waitFor({ state: 'hidden', timeout: 300000 }); // 5 minutes max wait
    
    // Wait a bit more for the status to update
    await page.waitForTimeout(2000);

    // Verify execution completed - check for "passed", "Complete", "Pass", or "Fail"
    const executionStatus = page.getByText(/passed|Complete|Pass|Fail/i).first();
    await expect(executionStatus).toBeVisible({ timeout: 90000 });
    
    const statusText = await executionStatus.textContent();
    console.log(`✅ Execution completed with status: ${statusText}`);

    // Verify "Execution Completed" message appears
    const executionCompleted = page.getByText(/Execution Completed/i).first();
    await expect(executionCompleted).toBeVisible({ timeout: 90000 });
    console.log('✅ Execution Completed message is visible');

    // Step 9: Click "Save as Automation Script" button
    console.log('💾 Clicking Save as Automation Script...');
    const saveAsScriptButton = page.getByRole('button', { name: 'Save as Automation Script' });
    await expect(saveAsScriptButton).toBeVisible({ timeout: 90000 });
    await expect(saveAsScriptButton).toBeEnabled({ timeout: 90000 });
    await saveAsScriptButton.click();
    console.log('✅ Clicked Save as Automation Script button');
    await page.waitForTimeout(2000);

    // Step 10: Verify the "Save Execution Record" dialog appears
    console.log('📋 Verifying Save Execution Record dialog...');
    const saveDialog = page.getByRole('heading', { name: 'Save Execution Record' });
    await expect(saveDialog).toBeVisible({ timeout: 90000 });
    console.log('✅ Save Execution Record dialog is visible');

    // Step 11: Click "Save" button in the dialog
    console.log('💾 Clicking Save button in dialog...');
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await expect(saveButton).toBeVisible({ timeout: 90000 });
    await expect(saveButton).toBeEnabled({ timeout: 90000 });
    await saveButton.click();
    console.log('✅ Clicked Save button');
    await page.waitForTimeout(3000);

    // Step 12: Verify the script was saved successfully
    console.log('✅ Verifying script was saved...');
    
    // Check for "Saved ✓" button
    const savedButton = page.getByRole('button', { name: /Saved/i });
    await expect(savedButton).toBeVisible({ timeout: 90000 });
    console.log('✅ Script saved successfully - "Saved ✓" button is visible');

    // Verify "Edit & Replay" button is available
    const editReplayButton = page.getByRole('button', { name: /Edit & Replay/i });
    await expect(editReplayButton).toBeVisible({ timeout: 90000 });
    console.log('✅ "Edit & Replay" button is visible');

    console.log('✅ Script Creator - Create and Save Script test completed successfully');
  });
});

