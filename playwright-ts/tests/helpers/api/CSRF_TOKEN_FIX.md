# CSRF Token Fix - Prevention Guide

## Issue Summary

The backend requires CSRF token protection for all state-changing API operations (POST, PUT, DELETE, PATCH). The original implementation was missing CSRF token extraction and inclusion in request headers, causing `403 CSRF_TOKEN_MISSING` errors.

## Solution Implemented

### 1. Enhanced `getAuthHeaders()` Function

**File**: `tests/helpers/api/login.ts`

- Automatically extracts CSRF token from cookies
- Adds `X-CSRF-Token` header to all requests
- Includes comprehensive documentation and warnings

**Key Changes**:
- Extracts `XSRF-TOKEN` from cookie string
- Adds it as `X-CSRF-Token` header
- Provides clear warnings if CSRF token is missing

### 2. Created `authTokenFromPage()` Helper

**File**: `tests/helpers/api/authTokenFromPage.ts`

- Centralized function to extract auth tokens from page context
- Automatically verifies CSRF token presence
- Provides clear error messages if token is missing

**Benefits**:
- Prevents code duplication
- Ensures consistent CSRF token handling
- Provides helpful error messages

### 3. Updated API Helper Functions

**Files Updated**:
- `tests/helpers/api/createTestCase.ts` - Now properly includes CSRF tokens
- `tests/TestLaunch/UpdateLaunchStatus.spec.ts` - Uses new helper
- `tests/API/CreateLaunch_ViaAPI.spec.ts` - Uses new helper
- `tests/API/Create_TC_viaAPI.spec.ts` - Uses new helper

### 4. Created Documentation

**File**: `tests/helpers/api/README.md`

- Comprehensive guide on CSRF token requirements
- Best practices and examples
- Troubleshooting guide
- Migration guide for existing code

## How to Prevent This Issue

### ✅ Always Use Helper Functions

**DO**:
```typescript
import { authTokenFromPage } from '../helpers/api/authTokenFromPage';
import { getAuthHeaders } from '../helpers/api/login';

const authToken = await authTokenFromPage(page);
const headers = getAuthHeaders(authToken); // CSRF token automatically included
```

**DON'T**:
```typescript
// Manual cookie extraction - CSRF token may be missing
const cookies = await page.context().cookies();
const authToken = {
  token: cookies.find(c => c.name === 'token')?.value || '',
  cookies: cookies.map(c => `${c.name}=${c.value}`).join('; '),
};
```

### ✅ Use `getAuthHeaders()` for All API Calls

The `getAuthHeaders()` function automatically handles:
- Cookie extraction and formatting
- CSRF token extraction from cookies
- CSRF token header inclusion
- Error warnings if tokens are missing

### ✅ Verify CSRF Token is Present

When using `page.request`:
1. Login via UI first (establishes session)
2. Navigate to a page (receives CSRF token cookie)
3. Use `authTokenFromPage()` to extract tokens
4. Use `getAuthHeaders()` to create headers

### ✅ Check for CSRF Errors

If you see this error:
```
403 - {"status":"error","code":"CSRF_TOKEN_MISSING",...}
```

**Immediate Actions**:
1. Verify you're using `getAuthHeaders()` 
2. Check that `authToken.cookies` includes `XSRF-TOKEN`
3. Ensure you've navigated to a page after login
4. Use `authTokenFromPage()` instead of manual extraction

## Testing Checklist

When creating new API helper functions or tests:

- [ ] Use `getAuthHeaders()` for all POST/PUT/DELETE/PATCH requests
- [ ] Use `authTokenFromPage()` when extracting tokens from page context
- [ ] Verify CSRF token is included in request headers
- [ ] Test with actual API calls to ensure no CSRF errors
- [ ] Document any special cases or exceptions

## Code Review Checklist

When reviewing code that makes API calls:

- [ ] Are helper functions used instead of manual cookie extraction?
- [ ] Is `getAuthHeaders()` called for state-changing operations?
- [ ] Are CSRF tokens properly included in headers?
- [ ] Are error messages clear if CSRF tokens are missing?

## Future Improvements

1. **Type Safety**: Consider adding TypeScript types that enforce CSRF token presence
2. **Automated Checks**: Add linting rules to detect manual cookie extraction
3. **Test Coverage**: Add tests that verify CSRF tokens are always included
4. **Documentation**: Keep README.md updated with new patterns

## Related Files

- `tests/helpers/api/login.ts` - Core authentication and header functions
- `tests/helpers/api/authTokenFromPage.ts` - Page context token extraction
- `tests/helpers/api/README.md` - Comprehensive API helper documentation
- `tests/helpers/api/setProject.ts` - Example of proper CSRF token usage
- `tests/helpers/api/createTestLaunch.ts` - Example of proper CSRF token usage

## Questions or Issues?

If you encounter CSRF token issues:
1. Check the README.md for troubleshooting steps
2. Verify you're using the latest helper functions
3. Review the examples in existing test files
4. Check backend logs for detailed error messages

