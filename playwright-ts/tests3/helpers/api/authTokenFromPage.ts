import { Page } from '@playwright/test';
import { AuthToken } from './login';

/**
 * Extracts authentication token and cookies from a Playwright page context.
 * This is useful when using page.request for API calls, as it ensures CSRF tokens
 * are properly extracted and included in headers.
 * 
 * IMPORTANT: The backend requires CSRF token protection for all state-changing operations
 * (POST, PUT, DELETE, PATCH). The CSRF token must be:
 * 1. Present in cookies as XSRF-TOKEN
 * 2. Included in request headers as X-CSRF-Token
 * 
 * This function extracts all cookies from the page context and formats them for use
 * with getAuthHeaders(), which automatically extracts and includes the CSRF token.
 * 
 * @param page - Playwright Page object with an active session
 * @returns AuthToken object with token and cookies string
 * 
 * @example
 * ```typescript
 * import { authTokenFromPage } from '../helpers/api/authTokenFromPage';
 * import { getAuthHeaders } from '../helpers/api/login';
 * 
 * test('make API call with page.request', async ({ page }) => {
 *   await login(page); // Login via UI first
 *   
 *   // Extract auth token from page context
 *   const authToken = await authTokenFromPage(page);
 *   
 *   // Use with API helpers - CSRF token will be automatically included
 *   const headers = getAuthHeaders(authToken);
 *   // headers now includes: Cookie, X-CSRF-Token, Content-Type
 * });
 * ```
 */
export async function authTokenFromPage(page: Page): Promise<AuthToken> {
  const cookies = await page.context().cookies();
  const tokenCookie = cookies.find(c => c.name === 'token');
  
  if (!tokenCookie) {
    throw new Error('Token cookie not found. Please ensure you are logged in before calling authTokenFromPage().');
  }
  
  // Format cookies as a string (name=value pairs separated by '; ')
  const cookiesString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  
  // Verify CSRF token is present
  const csrfCookie = cookies.find(c => c.name === 'XSRF-TOKEN' || c.name === 'xsrf-token');
  if (!csrfCookie) {
    console.warn('⚠️ CSRF token cookie (XSRF-TOKEN) not found in page context.');
    console.warn('   This may cause API calls to fail with CSRF_TOKEN_MISSING error.');
    console.warn('   Make sure you have navigated to a page after login to receive the CSRF token cookie.');
  }
  
  return {
    token: tokenCookie.value,
    cookies: cookiesString,
  };
}

