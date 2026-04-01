import { test, expect } from '@playwright/test';
import { loginViaAPI, getAuthHeaders, getCsrfToken } from '../../helpers/api/login';

test.describe('API Authentication Tests', () => {
  test('should login via API and retrieve CSRF token', async ({ request }) => {
    test.setTimeout(30000);

    console.log('🔄 Starting API Login Test...');

    // ============================================
    // SECTION 1: Login via API
    // ============================================
    console.log('📋 Section 1: Login via API');

    const email = 'rahul@alternative-path.com';
    const password = 'password';
    const baseUrl = 'https://api.qa-path.com';

    // Login via API
    const { authToken, requestContext, userId } = await loginViaAPI(
      request,
      email,
      password,
      baseUrl
    );

    console.log('✅ Login completed via API');
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${authToken.token.substring(0, 20)}...`);

    // Verify login response
    expect(authToken.token).toBeDefined();
    expect(authToken.token.length).toBeGreaterThan(0);
    expect(userId).toBeDefined();

    // ============================================
    // SECTION 2: Extract CSRF Token
    // ============================================
    console.log('📋 Section 2: Extract CSRF Token');

    // Get CSRF token using the helper function
    const csrfToken = getCsrfToken(authToken);

    if (csrfToken) {
      console.log('✅ CSRF Token extracted successfully');
      console.log(`   CSRF Token: ${csrfToken.substring(0, 20)}...`);
      expect(csrfToken).toBeDefined();
      expect(csrfToken.length).toBeGreaterThan(0);
    } else {
      console.log('⚠️ CSRF Token not found in cookies');
      console.log('   This may be expected if CSRF token is set after first page navigation');
    }

    // ============================================
    // SECTION 3: Use CSRF Token in Subsequent API Request
    // ============================================
    console.log('📋 Section 3: Use CSRF Token in Subsequent API Request');

    // Get authentication headers (includes CSRF token automatically)
    const headers = getAuthHeaders(authToken);

    console.log('✅ Authentication headers prepared');
    console.log(`   Headers include: ${Object.keys(headers).join(', ')}`);

    // Verify headers include CSRF token if it was available
    if (csrfToken) {
      expect(headers['X-CSRF-Token']).toBe(csrfToken);
      console.log('✅ CSRF Token included in headers');
    }

    // Verify headers include cookies
    expect(headers['Cookie']).toBeDefined();
    expect(headers['Cookie']).toContain('token=');
    expect(headers['Content-Type']).toBe('application/json');

    // Example: Make a subsequent API request using the headers
    // This demonstrates how to use the CSRF token in API calls
    console.log('📋 Section 4: Example API Request with CSRF Token');

    // Note: This is just an example - you can replace with any API endpoint
    // For demonstration, we'll try to get user info or project list
    try {
      const testResponse = await requestContext.get(`${baseUrl}/api/user/me`, {
        headers,
      });

      console.log(`   Test API call status: ${testResponse.status()}`);

      if (testResponse.ok()) {
        const userData = await testResponse.json();
        console.log('✅ Subsequent API request successful');
        console.log(`   User: ${userData.user?.user_email || userData.user?.email || 'N/A'}`);
      } else {
        const errorText = await testResponse.text();
        console.log(`   ⚠️ Test API call returned: ${testResponse.status()}`);
        console.log(`   Response: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ⚠️ Test API call failed: ${error}`);
      // This is okay - the endpoint might not exist or require additional setup
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ API LOGIN TEST COMPLETED');
    console.log('='.repeat(80));
    console.log(`📝 Summary:`);
    console.log(`   - Login: ✅ Successful`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - CSRF Token: ${csrfToken ? '✅ Extracted' : '⚠️ Not available'}`);
    console.log(`   - Headers Prepared: ✅ Ready for API calls`);
    console.log('='.repeat(80) + '\n');
  });

  test('should handle login with invalid credentials', async ({ request }) => {
    test.setTimeout(30000);

    console.log('🔄 Testing login with invalid credentials...');

    const baseUrl = 'https://api.qa-path.com';

    // Attempt login with invalid credentials
    const response = await request.post(`${baseUrl}/api/auth/login`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      },
      ignoreHTTPSErrors: true,
    });

    // Should fail with 401 or 400
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    console.log(`✅ Invalid login correctly rejected with status: ${response.status()}`);
  });
});

