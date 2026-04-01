# API Helper Functions

This directory contains helper functions for making API calls in Playwright tests.

## CSRF Token Protection

**IMPORTANT**: The backend requires CSRF token protection for all state-changing operations (POST, PUT, DELETE, PATCH). 

### How CSRF Protection Works

1. **CSRF Token Cookie**: The server sets a `XSRF-TOKEN` cookie when you first visit a page after login
2. **CSRF Token Header**: All POST/PUT/DELETE/PATCH requests must include the same token in the `X-CSRF-Token` header
3. **Validation**: The backend middleware validates that the header token matches the cookie token

### Common Error

If you see this error:
```
403 - {"status":"error","code":"CSRF_TOKEN_MISSING","message":"CSRF token missing. Please refresh the page and try again."}
```

This means the CSRF token was not included in the request headers.

## Best Practices

### ✅ DO: Use Helper Functions

Always use the provided helper functions which automatically handle CSRF tokens:

```typescript
import { authTokenFromPage } from '../helpers/api/authTokenFromPage';
import { getAuthHeaders } from '../helpers/api/login';
import { setProjectViaAPI } from '../helpers/api/setProject';

test('example', async ({ page }) => {
  // 1. Login via UI first (establishes session and CSRF token)
  await login(page);
  
  // 2. Extract auth token from page context (includes CSRF token)
  const authToken = await authTokenFromPage(page);
  
  // 3. Use with API helpers - CSRF token automatically included
  const projectData = await setProjectViaAPI(page.request, projectId, authToken);
});
```

### ✅ DO: Use `authTokenFromPage()` When Using `page.request`

When using `page.request` (which shares cookies with the browser context), always extract the auth token using the helper:

```typescript
// ✅ CORRECT
const authToken = await authTokenFromPage(page);
const headers = getAuthHeaders(authToken); // CSRF token automatically included
```

### ❌ DON'T: Manually Extract Cookies Without CSRF Token

```typescript
// ❌ WRONG - CSRF token may be missing
const cookies = await page.context().cookies();
const authToken = {
  token: cookies.find(c => c.name === 'token')?.value || '',
  cookies: cookies.map(c => `${c.name}=${c.value}`).join('; '),
};
// This might work, but if CSRF token extraction fails, API calls will fail
```

### ✅ DO: Use `getAuthHeaders()` for All API Calls

The `getAuthHeaders()` function automatically:
- Extracts the CSRF token from cookies
- Adds it to the `X-CSRF-Token` header
- Includes all necessary authentication cookies

```typescript
import { getAuthHeaders } from '../helpers/api/login';

const headers = getAuthHeaders(authToken);
// headers now includes:
// - Cookie: token=...; XSRF-TOKEN=...; connect.sid=...
// - X-CSRF-Token: <csrf-token-value>
// - Content-Type: application/json
```

## Available Helper Functions

### `authTokenFromPage(page: Page)`

Extracts authentication token and cookies from a Playwright page context. Automatically verifies CSRF token is present.

**Use when**: You're using `page.request` and need to make API calls with the browser's session.

### `getAuthHeaders(authToken: AuthToken)`

Creates request headers with authentication and CSRF token protection.

**Use for**: All API calls that modify state (POST, PUT, DELETE, PATCH).

### `loginViaAPI(request, email, password)`

Logs in via API and returns an auth token with cookies.

**Use when**: You need to create test data via API without UI interaction.

### `setProjectViaAPI(request, projectId, authToken)`

Sets the current project for the user session.

**Use when**: You need to switch projects before making project-specific API calls.

### `createTestLaunchViaAPI(request, options, authToken)`

Creates a test launch via API.

**Use when**: You need to create test launches programmatically.

### `createTestCaseViaAPI(request, options, authToken)`

Creates a test case via API.

**Use when**: You need to create test cases programmatically.

## Troubleshooting

### CSRF Token Not Found

**Symptom**: `CSRF_TOKEN_MISSING` error

**Solution**: 
1. Make sure you've logged in via UI first (this sets the CSRF token cookie)
2. Navigate to a page after login to receive the CSRF token cookie
3. Use `authTokenFromPage()` to extract the token
4. Use `getAuthHeaders()` which automatically includes the CSRF token

### Cookies Not Shared

**Symptom**: API calls fail with authentication errors

**Solution**:
- When using `page.request`, cookies are automatically shared
- When using a separate `APIRequestContext`, you need to manually include cookies in headers
- Always use `getAuthHeaders()` to ensure cookies are properly formatted

## Migration Guide

If you have existing code that manually extracts cookies, update it to use the helper functions:

**Before**:
```typescript
const cookies = await page.context().cookies();
const authToken = {
  token: cookies.find(c => c.name === 'token')?.value || '',
  cookies: cookies.map(c => `${c.name}=${c.value}`).join('; '),
};
```

**After**:
```typescript
import { authTokenFromPage } from '../helpers/api/authTokenFromPage';
const authToken = await authTokenFromPage(page);
```

This ensures CSRF tokens are always properly handled.

