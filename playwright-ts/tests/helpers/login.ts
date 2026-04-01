import { Page, expect } from '@playwright/test';

/**
 * Reusable login function for QA-Path application
 * 
 * @param page - Playwright page object
 * @param username - Email address for login (default: rahul@alternative-path.com)
 * @param password - Password for login (default: password)
 * @param baseUrl - Base URL of the application (default: https://qa-path.com)
 * 
 * @example
 * ```typescript
 * import { login } from './helpers/login';
 * 
 * test('my test', async ({ page }) => {
 *   await login(page);
 *   // Continue with your test...
 * });
 * ```
 */
export async function login(
  page: Page,
  username: string = 'rahul@alternative-path.com',
  password: string = 'password',
  baseUrl: string = 'https://qa-path.com'
): Promise<void> {
  // Navigate to the login page
  await page.goto(`${baseUrl}/login`);
  
  // Wait for page to load (10s after navigation as per instructions)
  await page.waitForTimeout(10000);
  
  // Verify we're on the login page
  await expect(page).toHaveURL(new RegExp(`${baseUrl}/login`), { timeout: 90000 });
  await expect(page).toHaveTitle('Product X', { timeout: 90000 });
  
  // Verify login form elements are visible
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({ timeout: 90000 });
  await expect(page.getByRole('heading', { name: 'Email address' })).toBeVisible({ timeout: 90000 });
  await expect(page.getByRole('heading', { name: 'Password' })).toBeVisible({ timeout: 90000 });
  
  // Fill in email address
  const emailInput = page.getByPlaceholder('Enter your email');
  await expect(emailInput).toBeVisible({ timeout: 90000 });
  await emailInput.fill(username);
  
  // Fill in password
  const passwordInput = page.getByPlaceholder('Enter your password');
  await expect(passwordInput).toBeVisible({ timeout: 90000 });
  await passwordInput.fill(password);
  
  // Click Sign in button
  const signInButton = page.getByRole('button', { name: 'Sign in' });
  await expect(signInButton).toBeVisible({ timeout: 90000 });
  await expect(signInButton).toBeEnabled({ timeout: 90000 });
  await signInButton.click();
  
  // Wait for navigation after login (6s after action as per instructions)
  await page.waitForTimeout(6000);
  
  // Verify successful login by checking we're redirected away from login page
  await expect(page).not.toHaveURL(new RegExp(`${baseUrl}/login`), { timeout: 90000 });
  
  // Verify we're logged in by checking for user profile or dashboard elements
  // The page should show user information or project list
  // Use first() to avoid strict mode violation when multiple elements match
  await expect(page.getByText(/Rahul Kochhar|Projects|Test Cases/i).first()).toBeVisible({ timeout: 90000 });
  
  console.log(`✅ Successfully logged in as ${username}`);
}

/**
 * Helper function to check if user is already logged in
 * 
 * @param page - Playwright page object
 * @param baseUrl - Base URL of the application (default: https://qa-path.com)
 * @returns true if user is logged in, false otherwise
 */
export async function isLoggedIn(
  page: Page,
  baseUrl: string = 'https://qa-path.com'
): Promise<boolean> {
  try {
    // Check if we're on a protected page (not login page)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      return false;
    }
    
    // Check for user profile indicator
    const userIndicator = page.getByText(/Rahul Kochhar|Projects|Test Cases/i).first();
    const isVisible = await userIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    return isVisible;
  } catch {
    return false;
  }
}

/**
 * Reusable login function that checks if already logged in before attempting login
 * 
 * @param page - Playwright page object
 * @param username - Email address for login (default: rahul@alternative-path.com)
 * @param password - Password for login (default: password)
 * @param baseUrl - Base URL of the application (default: https://qa-path.com)
 */
export async function loginIfNeeded(
  page: Page,
  username: string = 'rahul@alternative-path.com',
  password: string = 'password',
  baseUrl: string = 'https://qa-path.com'
): Promise<void> {
  const loggedIn = await isLoggedIn(page, baseUrl);
  if (loggedIn) {
    console.log('✅ User is already logged in, skipping login step');
    return;
  }
  
  await login(page, username, password, baseUrl);
}

