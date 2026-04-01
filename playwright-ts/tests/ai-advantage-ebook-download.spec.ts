import { test, expect } from '@playwright/test';

/**
 * Test: AI Advantage eBook Download Flow
 * 
 * This test validates the complete user journey for downloading the AI Advantage eBook:
 * 1. Navigate to the eBook landing page
 * 2. Click the download button
 * 3. Verify the popup form appears
 * 4. Fill in required user information
 * 5. Submit the form
 */
test.describe('AI Advantage eBook Download', () => {
  test('should successfully download AI Advantage eBook with user information', async ({ page }) => {
    // Navigate to the AI Advantage eBook page
    await page.goto('https://canoeintelligence.com/ai-advantage-ebook/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the correct page by checking for key content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 90000 });
    
    // Look for the download button using multiple strategies for resilience
    const downloadButton = await page.getByRole('button', { name: /download now/i })
      .or(page.getByText(/download now/i))
      .or(page.locator('[data-testid="download-button"]'))
      .or(page.locator('a[href*="download"]'))
      .first();
    
    // Verify download button is visible and clickable
    await expect(downloadButton).toBeVisible({ timeout: 90000 });
    
    // Click the download button
    await downloadButton.click();
    
    // Wait for popup to appear (modal or form)
    await page.waitForTimeout(2000); // Brief wait for animation
    
    // Verify popup/modal is visible using multiple strategies
    const popup = await page.locator('[role="dialog"]')
      .or(page.locator('.modal'))
      .or(page.locator('[data-testid="download-form"]'))
      .or(page.locator('form'))
      .first();
    
    await expect(popup).toBeVisible({ timeout: 90000 });
    
    // Fill in email field
    const emailField = await page.getByLabel(/email/i)
      .or(page.getByRole('textbox', { name: /email/i }))
      .or(page.locator('input[type="email"]'))
      .or(page.locator('[data-testid="email-input"]'))
      .first();
    
    await expect(emailField).toBeVisible({ timeout: 90000 });
    await emailField.fill('test@example.com');
    
    // Fill in first name field
    const firstNameField = await page.getByLabel(/first name/i)
      .or(page.getByRole('textbox', { name: /first name/i }))
      .or(page.locator('input[name*="first"]'))
      .or(page.locator('[data-testid="firstname-input"]'))
      .first();
    
    await expect(firstNameField).toBeVisible({ timeout: 90000 });
    await firstNameField.fill('John');
    
    // Fill in last name field
    const lastNameField = await page.getByLabel(/last name/i)
      .or(page.getByRole('textbox', { name: /last name/i }))
      .or(page.locator('input[name*="last"]'))
      .or(page.locator('[data-testid="lastname-input"]'))
      .first();
    
    await expect(lastNameField).toBeVisible({ timeout: 90000 });
    await lastNameField.fill('Doe');
    
    // Submit the form
    const submitButton = await page.getByRole('button', { name: /submit/i })
      .or(page.getByRole('button', { name: /download/i }))
      .or(page.getByText(/submit/i))
      .or(page.locator('[data-testid="submit-button"]'))
      .first();
    
    await expect(submitButton).toBeVisible({ timeout: 90000 });
    await submitButton.click();
    
    // Verify successful submission (this could be a success message, redirect, or download)
    // Using multiple strategies to handle different success indicators
    try {
      // Check for success message
      await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 });
    } catch {
      try {
        // Check for download starting
        await expect(page.getByText(/download/i)).toBeVisible({ timeout: 10000 });
      } catch {
        // Check if we're redirected to a thank you page
        await expect(page.url()).toContain('thank-you');
      }
    }
  });
  
  test('should handle form validation errors gracefully', async ({ page }) => {
    // Navigate to the page
    await page.goto('https://canoeintelligence.com/ai-advantage-ebook/');
    await page.waitForLoadState('networkidle');
    
    // Click download button
    const downloadButton = await page.getByRole('button', { name: /download now/i })
      .or(page.getByText(/download now/i))
      .first();
    
    await downloadButton.click();
    await page.waitForTimeout(2000);
    
    // Try to submit without filling required fields
    const submitButton = await page.getByRole('button', { name: /submit/i })
      .or(page.getByText(/submit/i))
      .first();
    
    await submitButton.click();
    
    // Verify validation errors appear
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 10000 });
  });
  
  test('should close popup when clicking outside or cancel', async ({ page }) => {
    // Navigate to the page
    await page.goto('https://canoeintelligence.com/ai-advantage-ebook/');
    await page.waitForLoadState('networkidle');
    
    // Click download button
    const downloadButton = await page.getByRole('button', { name: /download now/i })
      .or(page.getByText(/download now/i))
      .first();
    
    await downloadButton.click();
    await page.waitForTimeout(2000);
    
    // Try to close popup by clicking outside or escape key
    try {
      // Click outside the modal
      await page.mouse.click(10, 10);
    } catch {
      // Or press escape key
      await page.keyboard.press('Escape');
    }
    
    // Verify popup is no longer visible
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
  });
});


