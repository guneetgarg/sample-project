import { test, expect } from '@playwright/test';

test.describe('AP Agent Site Exploration', () => {
  test('should explore the current state of ap-agent.qa-path.com/test-automation/', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(120000);
    
    console.log('🔍 Starting exploration of AP Agent Test Automation Platform...');
    
    // Step 1: Navigate to the site
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
    
    // Wait for page to load
    await page.waitForTimeout(10000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/exploration-01-initial-load.png', 
      fullPage: true 
    });
    
    // Verify page loaded
    try {
      await expect(page).toHaveTitle('Test Automation Agent', { timeout: 30000 });
      console.log('✅ Page loaded successfully with title: Test Automation Agent');
    } catch (error) {
      const actualTitle = await page.title();
      console.log(`⚠️ Unexpected title: "${actualTitle}"`);
    }
    
    // Get all visible text content
    const pageContent = await page.locator('body').textContent();
    console.log('\n=== FULL PAGE CONTENT ===');
    console.log(pageContent);
    
    // Step 2: Explore main tabs
    console.log('\n🔍 Exploring main navigation tabs...');
    
    const mainTabs = await page.getByRole('tab').all();
    console.log(`Found ${mainTabs.length} main tabs`);
    
    for (let i = 0; i < mainTabs.length; i++) {
      try {
        const tabText = await mainTabs[i].textContent();
        const isSelected = await mainTabs[i].getAttribute('aria-selected');
        console.log(`Tab ${i + 1}: "${tabText}" (selected: ${isSelected})`);
        
        // Click each tab to explore content
        await mainTabs[i].click();
        await page.waitForTimeout(3000);
        
        // Take screenshot of each tab
        await page.screenshot({ 
          path: `test-results/exploration-tab-${i + 1}-${tabText?.replace(/[^a-zA-Z0-9]/g, '-')}.png`, 
          fullPage: true 
        });
        
        // Get tab-specific content
        const tabContent = await page.locator('body').textContent();
        console.log(`\n--- Content for "${tabText}" tab ---`);
        console.log(tabContent?.substring(0, 500) + '...');
        
      } catch (error) {
        console.log(`❌ Error exploring tab ${i + 1}: ${error}`);
      }
    }
    
    // Step 3: Explore Test Plan Manager specifically
    console.log('\n🔍 Exploring Test Plan Manager in detail...');
    
    try {
      const testPlanManagerTab = page.getByRole('tab', { name: 'Test Plan Manager' });
      await testPlanManagerTab.click();
      await page.waitForTimeout(5000);
      
      // Look for dropdowns/selects
      const dropdowns = await page.locator('[role="combobox"]').all();
      console.log(`Found ${dropdowns.length} dropdown elements`);
      
      for (let i = 0; i < dropdowns.length; i++) {
        const dropdownText = await dropdowns[i].textContent();
        console.log(`Dropdown ${i + 1}: "${dropdownText}"`);
        
        // Try to click and see options
        try {
          await dropdowns[i].click();
          await page.waitForTimeout(2000);
          
          // Look for options
          const options = await page.getByRole('option').all();
          console.log(`  Found ${options.length} options:`);
          
          for (let j = 0; j < Math.min(options.length, 10); j++) {
            const optionText = await options[j].textContent();
            console.log(`    Option ${j + 1}: "${optionText}"`);
          }
          
          // Take screenshot of dropdown options
          await page.screenshot({ 
            path: `test-results/exploration-dropdown-${i + 1}-options.png`, 
            fullPage: true 
          });
          
          // Click away to close dropdown
          await page.locator('body').click();
          await page.waitForTimeout(1000);
          
        } catch (error) {
          console.log(`  ❌ Could not explore dropdown ${i + 1}: ${error}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error exploring Test Plan Manager: ${error}`);
    }
    
    // Step 4: Explore all buttons
    console.log('\n🔍 Exploring all buttons...');
    
    const buttons = await page.getByRole('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      try {
        const buttonText = await buttons[i].textContent();
        const isEnabled = await buttons[i].isEnabled();
        const isVisible = await buttons[i].isVisible();
        console.log(`Button ${i + 1}: "${buttonText}" (enabled: ${isEnabled}, visible: ${isVisible})`);
      } catch (error) {
        console.log(`❌ Error checking button ${i + 1}: ${error}`);
      }
    }
    
    // Step 5: Explore input fields
    console.log('\n🔍 Exploring input fields...');
    
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);
    
    for (let i = 0; i < inputs.length; i++) {
      try {
        const inputType = await inputs[i].getAttribute('type');
        const inputValue = await inputs[i].inputValue();
        const placeholder = await inputs[i].getAttribute('placeholder');
        console.log(`Input ${i + 1}: type="${inputType}", value="${inputValue}", placeholder="${placeholder}"`);
      } catch (error) {
        console.log(`❌ Error checking input ${i + 1}: ${error}`);
      }
    }
    
    // Step 6: Look for any test plans or test-related content
    console.log('\n🔍 Searching for test plan related content...');
    
    // Search for elements containing "rahul" or "testplan"
    const rahulElements = await page.locator('text=/rahul/i').all();
    console.log(`Found ${rahulElements.length} elements containing "rahul"`);
    
    for (let i = 0; i < rahulElements.length; i++) {
      const elementText = await rahulElements[i].textContent();
      console.log(`  Rahul element ${i + 1}: "${elementText}"`);
    }
    
    const testplanElements = await page.locator('text=/testplan/i').all();
    console.log(`Found ${testplanElements.length} elements containing "testplan"`);
    
    for (let i = 0; i < testplanElements.length; i++) {
      const elementText = await testplanElements[i].textContent();
      console.log(`  Testplan element ${i + 1}: "${elementText}"`);
    }
    
    // Step 7: Check for any error messages or loading states
    console.log('\n🔍 Checking for error messages or loading states...');
    
    const errorMessages = await page.locator('text=/error|failed|not found/i').all();
    console.log(`Found ${errorMessages.length} potential error messages`);
    
    for (let i = 0; i < errorMessages.length; i++) {
      const errorText = await errorMessages[i].textContent();
      console.log(`  Error/Warning ${i + 1}: "${errorText}"`);
    }
    
    // Step 8: Final comprehensive screenshot
    await page.screenshot({ 
      path: 'test-results/exploration-final-state.png', 
      fullPage: true 
    });
    
    console.log('\n=== EXPLORATION SUMMARY ===');
    console.log('✅ Site exploration completed');
    console.log(`✅ Found ${mainTabs.length} main tabs`);
    console.log(`✅ Found ${buttons.length} buttons`);
    console.log(`✅ Found ${inputs.length} input fields`);
    console.log(`✅ Found ${dropdowns.length} dropdown elements`);
    console.log('✅ Screenshots captured for detailed analysis');
    console.log('\n🎉 Exploration completed successfully!');
  });
});
