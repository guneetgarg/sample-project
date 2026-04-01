import { APIRequestContext, request as playwrightRequest } from '@playwright/test';

/**
 * Interface for login API response
 */
export interface LoginResponse {
  user: {
    id: string;
    username: string;
    user_email: string;
    email?: string;
    roles: string[];
    permissions: any[];
    token: string;
    org_id: string;
    authority_level: number;
    [key: string]: any;
  };
}

/**
 * Interface for authentication token
 */
export interface AuthToken {
  token: string;
  cookies?: string;
}

/**
 * Login via API and get authentication token
 * This is faster than UI-based login and can be used for API test data creation
 * 
 * @param request - Playwright APIRequestContext (optional, will create new one if not provided)
 * @param email - Email address for login (default: rahul@alternative-path.com)
 * @param password - Password for login (default: password)
 * @param baseUrl - Base API URL (default: https://api.qa-path.com)
 * @returns Promise<{authToken: AuthToken, requestContext: APIRequestContext}> - Authentication token and request context with cookies
 * 
 * @example
 * ```typescript
 * import { loginViaAPI } from '../helpers/api/login';
 * 
 * test('login via API', async ({ request }) => {
 *   const { authToken, requestContext } = await loginViaAPI(request);
 *   console.log(`Token: ${authToken.token}`);
 *   // Use requestContext for subsequent API calls - it will have cookies set
 * });
 * ```
 */
export async function loginViaAPI(
  request?: APIRequestContext,
  email: string = 'rahul@alternative-path.com',
  password: string = 'password',
  baseUrl: string = 'https://api.qa-path.com'
): Promise<{ authToken: AuthToken; requestContext: APIRequestContext; userId: string }> {
  console.log('🔐 Logging in via API...');
  console.log(`   Email: ${email}`);

  const loginPayload = {
    email,
    password,
  };

  // Use provided request context or create a new one
  // Add timeout and SSL error handling to prevent TLS connection issues
  const requestContext = request || await playwrightRequest.newContext({
    ignoreHTTPSErrors: true,
    timeout: 60000, // 60 second timeout
  });

  // Retry logic for TLS connection issues
  let response;
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      response = await requestContext.post(`${baseUrl}/api/auth/login`, {
        data: loginPayload,
        ignoreHTTPSErrors: true, // Ignore SSL certificate errors for QA environment
        timeout: 60000, // 60 second timeout per request
      });
      break; // Success, exit retry loop
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      
      // Check if it's a TLS/network error
      if (errorMessage.includes('socket disconnected') || 
          errorMessage.includes('TLS') || 
          errorMessage.includes('ECONNRESET') ||
          errorMessage.includes('ETIMEDOUT')) {
        retries--;
        if (retries > 0) {
          const waitTime = (4 - retries) * 2000; // Exponential backoff: 2s, 4s, 6s
          console.log(`   ⚠️ TLS connection error, retrying in ${waitTime}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      } else {
        // Not a retryable error, throw immediately
        throw error;
      }
    }
  }

  // If we exhausted retries, throw the last error
  if (!response) {
    console.error('   ❌ Login failed after retries');
    throw lastError || new Error('Login failed: TLS connection could not be established');
  }

  if (!response.ok()) {
    const errorText = await response.text();
    console.error('   ❌ Login failed');
    console.error(`   Status: ${response.status()}`);
    console.error(`   Error: ${errorText}`);
    throw new Error(`Login failed: ${response.status()} - ${errorText}`);
  }

  const loginData = await response.json() as LoginResponse;

  // Extract token from response
  const token = loginData?.user?.token;
  if (!token) {
    throw new Error('Token not found in login response');
  }

  console.log('   ✅ Login successful');
  console.log(`   User ID: ${loginData.user.id}`);
  console.log(`   Username: ${loginData.user.username || loginData.user.user_email}`);
  console.log(`   Token: ${token.substring(0, 20)}...`);

  // Extract cookies from response headers
  // The API uses session-based authentication which requires:
  // 1. Token cookie (req.cookies.token)
  // 2. Session cookie (connect.sid) to retrieve req.session from session store
  // We need to extract ALL cookies from Set-Cookie headers
  const allHeaders = response.headers();
  const setCookieHeaders = allHeaders['set-cookie'] || allHeaders['Set-Cookie'];
  let cookies = '';
  
  if (setCookieHeaders) {
    // Handle both single string and array of strings
    const cookieArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    const cookiePairs = cookieArray
      .map(cookie => {
        // Extract cookie name=value from Set-Cookie header
        // Format: "token=value; Path=/; HttpOnly; SameSite=Lax"
        // or "connect.sid=s%3A...; Path=/; HttpOnly; SameSite=Lax"
        const match = cookie.match(/^([^=]+)=([^;]+)/);
        return match ? `${match[1]}=${match[2]}` : '';
      })
      .filter(Boolean);
    
    cookies = cookiePairs.join('; ');
    console.log(`   Cookies extracted: ${cookiePairs.length} cookie(s)`);
    console.log(`   Cookie names: ${cookiePairs.map(c => c.split('=')[0]).join(', ')}`);
    
    // Verify we have the token cookie
    const hasTokenCookie = cookiePairs.some(c => c.startsWith('token='));
    if (!hasTokenCookie) {
      console.log('   ⚠️ Token cookie not found in Set-Cookie, adding it manually');
      cookies = `token=${token}; ${cookies}`;
    }
  } else {
    // Fallback: construct cookie from token if Set-Cookie header not available
    cookies = `token=${token}`;
    console.log('   ⚠️ Set-Cookie header not found, using token as cookie');
  }

  const authToken: AuthToken = {
    token,
    cookies: cookies || `token=${token}`, // Always provide cookies
  };

  // The requestContext now has the cookies set from the login response
  // Subsequent requests using this context will automatically include the cookies
  return {
    authToken,
    requestContext, // Return the context so it can be reused with cookies
    userId: loginData.user.id, // Return user ID for use in API calls
  };
}

/**
 * Get authentication headers for API requests
 * 
 * IMPORTANT: This function automatically extracts and includes the CSRF token from cookies.
 * The backend requires CSRF token protection for all state-changing operations (POST, PUT, DELETE, PATCH).
 * 
 * CSRF Token Requirements:
 * - The CSRF token must be present in cookies as XSRF-TOKEN
 * - The same token must be included in request headers as X-CSRF-Token
 * - This function handles both automatically when cookies are provided
 * 
 * @param authToken - Authentication token from loginViaAPI or authTokenFromPage()
 * @returns Headers object with authentication, including CSRF token
 * 
 * @example
 * ```typescript
 * // When using loginViaAPI:
 * const { authToken } = await loginViaAPI(request);
 * const headers = getAuthHeaders(authToken); // CSRF token automatically included
 * 
 * // When using page.request (browser context):
 * import { authTokenFromPage } from './authTokenFromPage';
 * const authToken = await authTokenFromPage(page);
 * const headers = getAuthHeaders(authToken); // CSRF token automatically included
 * ```
 */
export function getAuthHeaders(authToken: AuthToken): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // The API uses session-based authentication with a cookie
  // Always use cookies for authentication
  if (authToken.cookies) {
    headers['Cookie'] = authToken.cookies;
    
    // CRITICAL: Extract CSRF token from cookies and add to headers
    // The backend middleware validates that X-CSRF-Token header matches XSRF-TOKEN cookie
    // Without this, all POST/PUT/DELETE/PATCH requests will fail with 403 CSRF_TOKEN_MISSING
    const csrfTokenMatch = authToken.cookies.match(/XSRF-TOKEN=([^;]+)/i);
    if (csrfTokenMatch) {
      const csrfToken = csrfTokenMatch[1];
      headers['X-CSRF-Token'] = csrfToken;
    } else {
      // Also try lowercase version (some servers may use lowercase)
      const csrfTokenMatchLower = authToken.cookies.match(/xsrf-token=([^;]+)/i);
      if (csrfTokenMatchLower) {
        const csrfToken = csrfTokenMatchLower[1];
        headers['X-CSRF-Token'] = csrfToken;
      } else {
        // Log warning but don't throw - let the API return the error for better debugging
        console.warn('⚠️ CSRF token not found in cookies. API calls may fail with CSRF_TOKEN_MISSING error.');
      }
    }
  } else if (authToken.token) {
    // Fallback: construct cookie from token (but CSRF token won't be available)
    headers['Cookie'] = `token=${authToken.token}`;
    console.warn('⚠️ Using token-only cookie. CSRF token not available. API calls may fail.');
  }

  // Note: The API uses cookie-based session authentication, not Bearer tokens
  // The token is sent as a cookie, not in the Authorization header

  return headers;
}

/**
 * Extract CSRF token from authentication token cookies
 * 
 * This helper function extracts the XSRF-TOKEN value from the cookies string
 * in the AuthToken object. The CSRF token is required for all state-changing
 * API operations (POST, PUT, DELETE, PATCH).
 * 
 * @param authToken - Authentication token from loginViaAPI or authTokenFromPage()
 * @returns CSRF token string if found, undefined otherwise
 * 
 * @example
 * ```typescript
 * const { authToken } = await loginViaAPI(request);
 * const csrfToken = getCsrfToken(authToken);
 * 
 * if (csrfToken) {
 *   // Use csrfToken in API request headers
 *   const headers = {
 *     'X-CSRF-Token': csrfToken,
 *     'Cookie': authToken.cookies,
 *   };
 * }
 * ```
 */
export function getCsrfToken(authToken: AuthToken): string | undefined {
  if (!authToken.cookies) {
    return undefined;
  }

  // Try to extract XSRF-TOKEN from cookies (case-insensitive)
  const csrfTokenMatch = authToken.cookies.match(/XSRF-TOKEN=([^;]+)/i);
  if (csrfTokenMatch) {
    return csrfTokenMatch[1];
  }

  // Also try lowercase version
  const csrfTokenMatchLower = authToken.cookies.match(/xsrf-token=([^;]+)/i);
  if (csrfTokenMatchLower) {
    return csrfTokenMatchLower[1];
  }

  return undefined;
}

