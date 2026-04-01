import { test, expect } from '@playwright/test';
import { login, loginIfNeeded, isLoggedIn } from './helpers/login';

test.describe('QA-Path Login Tests', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(120000);
    
    console.log('🔐 Starting login test...');
    
    // Use the reusable login function
    await login(page);
    
    // Verify we're on a protected page (not login page)
    await expect(page).not.toHaveURL(/\/login/);
    
    // Verify page title
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    
    // Verify user is logged in by checking for user profile or navigation elements
    // The page should show either the user name or project-related content
    const userLoggedIn = await page.getByText(/Rahul Kochhar|Projects|Test Cases/i).first().isVisible({ timeout: 90000 });
    expect(userLoggedIn).toBeTruthy();
    
    console.log('✅ Login test completed successfully');
  });

  test('should login with custom credentials', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🔐 Testing login with custom credentials...');
    
    // Use the reusable login function with custom credentials
    await login(
      page,
      'rahul@alternative-path.com',
      'password',
      'https://qa-path.com'
    );
    
    // Verify successful login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    
    console.log('✅ Custom credentials login test completed successfully');
  });

  test('should check if user is already logged in', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🔍 Checking login status...');
    
    // Navigate to the application
    await page.goto('https://qa-path.com');
    await page.waitForTimeout(10000);
    
    // Check login status
    const loggedIn = await isLoggedIn(page);
    console.log(`Login status: ${loggedIn ? 'Logged in' : 'Not logged in'}`);
    
    // If not logged in, perform login
    if (!loggedIn) {
      console.log('🔐 User not logged in, performing login...');
      await login(page);
    } else {
      console.log('✅ User is already logged in');
    }
    
    // Verify we're logged in after the check
    const finalStatus = await isLoggedIn(page);
    expect(finalStatus).toBeTruthy();
    
    console.log('✅ Login status check completed successfully');
  });

  test('should use loginIfNeeded helper function', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🔐 Testing loginIfNeeded helper...');
    
    // Navigate to the application
    await page.goto('https://qa-path.com');
    await page.waitForTimeout(10000);
    
    // Use loginIfNeeded - it will check if already logged in
    await loginIfNeeded(page);
    
    // Verify we're logged in
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    
    // Verify user is logged in
    const userLoggedIn = await page.getByText(/Rahul Kochhar|Projects|Test Cases/i).first().isVisible({ timeout: 90000 });
    expect(userLoggedIn).toBeTruthy();
    
    console.log('✅ loginIfNeeded test completed successfully');
  });

  test('should navigate to specific page after login', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🔐 Testing login and navigation to specific page...');
    
    // Login first
    await login(page);
    
    // Navigate to a specific test cases page
    const targetUrl = 'https://qa-path.com/home/projects/d7735c45-30e0-417a-806f-524b000bf75d/test-cases?moduleId=b4750b1c-1db3-421b-99ba-f8d1230d4be2';
    await page.goto(targetUrl);
    
    // Wait for page to load
    await page.waitForTimeout(10000);
    
    // Verify we're on the correct page
    await expect(page).toHaveURL(new RegExp('/test-cases'), { timeout: 90000 });
    await expect(page).toHaveTitle('Product X', { timeout: 90000 });
    
    // Verify test cases page content is visible
    await expect(page.getByText(/Test Cases|CreatedbyAutomation/i).first()).toBeVisible({ timeout: 90000 });
    
    console.log('✅ Login and navigation test completed successfully');
  });
});

