import { test, expect } from '@playwright/test';
import { loginViaAPI, getAuthHeaders, getCsrfToken } from '../../helpers/api/login';
import { maybeFailAt, getFailureTypesForPhase } from '../../helpers/failureInjector';

test.describe('API Authentication Tests', () => {
  test('should login via API and retrieve CSRF token', async ({ request }) => {
    test.setTimeout(30000);

    console.log('🔄 Starting API Login Test...');

    // ============================================
    // SECTION 1: Login via API
    // ============================================
    console.log('📋 Section 1: Login via API');

    const email = 'rahul@alternative-path.com';
    const password = 'Admin@123';

    // 💥 FAILURE INJECTION POINT 1: Before API login attempt
    // Simulates: connection-refused, timeout, network-failure
    const mockPage = { evaluate: async () => { }, locator: () => ({ isVisible: async () => false }), route: async () => { }, unroute: async () => { }, waitForTimeout: async () => { }, goto: async () => { }, click: async () => { }, waitForResponse: async () => { } } as any;
    await maybeFailAt(mockPage, 'before-api-login', 0.2, getFailureTypesForPhase('api'));

    const loginResponse = await loginViaAPI(request, email, password);

    console.log('📊 Login Response Status:', loginResponse.status);
    console.log('📊 Login Response Body:', JSON.stringify(loginResponse.body).substring(0, 200));

    // 💥 FAILURE INJECTION POINT 2: After login, before assertions
    // Simulates: assertion-failure
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting login response contains unexpected field...');
      expect(loginResponse.body).toHaveProperty('nonExistentField_injected');
    }

    // Verify login was successful
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toBeTruthy();
    console.log('✅ Login via API successful');

    // ============================================
    // SECTION 2: Retrieve CSRF Token
    // ============================================
    console.log('📋 Section 2: Retrieve CSRF Token');

    // 💥 FAILURE INJECTION POINT 3: Before CSRF token retrieval
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Simulating CSRF token endpoint failure...');
      const badResponse = await request.get('https://qa-path.com/api/nonexistent-csrf-endpoint');
      expect(badResponse.status()).toBe(200);
    }

    const csrfToken = await getCsrfToken(request);

    console.log('📊 CSRF Token:', csrfToken ? csrfToken.substring(0, 20) + '...' : 'null');

    // Verify CSRF token was retrieved
    expect(csrfToken).toBeTruthy();
    expect(typeof csrfToken).toBe('string');
    expect(csrfToken!.length).toBeGreaterThan(0);
    console.log('✅ CSRF Token retrieved successfully');

    // ============================================
    // SECTION 3: Get Auth Headers
    // ============================================
    console.log('📋 Section 3: Get Auth Headers');

    const authHeaders = await getAuthHeaders(request);

    console.log('📊 Auth Headers Keys:', Object.keys(authHeaders));

    // 💥 FAILURE INJECTION POINT 4: During header verification
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Asserting auth headers contain non-existent key...');
      expect(authHeaders).toHaveProperty('X-Nonexistent-Auth-Header-Injected');
    }

    // Verify auth headers are complete
    expect(authHeaders).toBeTruthy();
    expect(typeof authHeaders).toBe('object');
    console.log('✅ Auth Headers retrieved successfully');

    // ============================================
    // SECTION 4: Verify Authenticated Request
    // ============================================
    console.log('📋 Section 4: Verify Authenticated Request');

    // 💥 FAILURE INJECTION POINT 5: Simulating API failure on authenticated request
    if (Math.random() < 0.2) {
      console.log('💥 [INJECTED FAILURE] Simulating 503 Service Unavailable on authenticated request...');
      throw new Error('net::ERR_CONNECTION_REFUSED at https://qa-path.com/api/auth/verify - The server actively refused the connection.');
    }

    // Make an authenticated request to verify the session
    const verifyResponse = await request.get('https://qa-path.com/api/auth/session', {
      headers: authHeaders,
    });

    console.log('📊 Verify Response Status:', verifyResponse.status());

    // Verify the session is valid
    expect(verifyResponse.ok()).toBeTruthy();
    console.log('✅ Authenticated request successful');

    // ============================================
    // SECTION 5: Summary
    // ============================================
    console.log('📋 Section 5: Summary');
    console.log('✅ All API Authentication tests passed');
    console.log('  - Login via API: ✅');
    console.log('  - CSRF Token retrieval: ✅');
    console.log('  - Auth Headers: ✅');
    console.log('  - Authenticated request: ✅');

    // 💥 FAILURE INJECTION POINT 6: Final summary assertion failure
    if (Math.random() < 0.15) {
      console.log('💥 [INJECTED FAILURE] Final verification assertion mismatch...');
      expect(verifyResponse.status()).toBe(999);
    }
  });
});
