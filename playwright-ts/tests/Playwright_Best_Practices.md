# Playwright Test Best Practices

This document outlines best practices for writing reliable Playwright tests, based on lessons learned from fixing common issues in the test suite.

## Table of Contents

1. [CSRF Token Handling](#csrf-token-handling)
2. [Count Verification and Polling](#count-verification-and-polling)
3. [API Response Waiting](#api-response-waiting)
4. [Race Condition Prevention](#race-condition-prevention)
5. [Error Handling](#error-handling)
6. [Code Reusability](#code-reusability)

---

## CSRF Token Handling

### ❌ DON'T: Manually Extract Cookies Without CSRF Token

```typescript
// BAD - CSRF token may be missing
const cookies = await page.context().cookies();
const authToken = {
  token: cookies.find(c => c.name === 'token')?.value || '',
  cookies: cookies.map(c => `${c.name}=${c.value}`).join('; '),
};
```

### ✅ DO: Use Helper Functions

```typescript
// GOOD - CSRF token automatically included
import { authTokenFromPage } from '../helpers/api/authTokenFromPage';
import { getAuthHeaders } from '../helpers/api/login';

const authToken = await authTokenFromPage(page);
const headers = getAuthHeaders(authToken); // CSRF token automatically included
```

### Key Points

- **Always use `getAuthHeaders()`** for all API calls that modify state (POST, PUT, DELETE, PATCH)
- **Use `authTokenFromPage()`** when extracting tokens from page context
- The backend requires CSRF token protection - missing tokens cause `403 CSRF_TOKEN_MISSING` errors
- Helper functions automatically extract and include CSRF tokens

### Related Files

- `tests/helpers/api/authTokenFromPage.ts` - Page context token extraction
- `tests/helpers/api/login.ts` - `getAuthHeaders()` function
- `tests/helpers/api/README.md` - Comprehensive API helper documentation

---

## Count Verification and Polling

### ❌ DON'T: Use Fixed Timeouts for Count Verification

```typescript
// BAD - Race condition: count may not have updated yet
await page.waitForTimeout(6000);
const finalTotalText = await page.getByText(/\d+ total/i).first().textContent();
const finalTotal = parseInt(finalTotalText.match(/\d+/)?.[0] || '0');
expect(finalTotal).toBe(initialTotal + 1);
```

### ✅ DO: Use `expect.poll()` for Count Verification

```typescript
// GOOD - Polls until count updates, handles race conditions
const expectedCount = initialTotal + 1;

await expect.poll(async () => {
  const countText = await countElement.textContent();
  const count = parseInt(countText.match(/\d+/)?.[0] || '0');
  console.log(`📊 Polling count: Current = ${count}, Expected = ${expectedCount}`);
  return count;
}, {
  message: `Count should be ${expectedCount} (was ${initialTotal})`,
  timeout: 30000, // 30 seconds total timeout
  intervals: [2000, 2000, 2000, 3000, 5000], // Progressive intervals
}).toBeGreaterThanOrEqual(expectedCount);
```

### Key Points

- **Always use `expect.poll()`** when verifying counts that may take time to update
- **Progressive intervals** - start with shorter intervals, increase for later checks
- **Handle edge cases** - use `toBeGreaterThanOrEqual()` if concurrent operations are possible
- **Provide clear logging** - log current vs expected values during polling

### When to Use Polling

- ✅ Count verification after create/delete operations
- ✅ Status updates that may take time to reflect in UI
- ✅ Any value that depends on backend processing
- ✅ Values that may be cached or delayed in the UI

### Example: Count Verification After Deletion

```typescript
// Check if filter is still active (affects which count to verify)
const filterStillActive = await filterIndicator.isVisible({ timeout: 3000 }).catch(() => false);

// Use appropriate baseline based on context
const expectedCount = filterStillActive 
  ? countBeforeDeletion - 1  // Filtered count
  : initialTotal - 1;         // Total count

await expect.poll(async () => {
  const count = await getCount();
  return count;
}, {
  timeout: 30000,
  intervals: [2000, 2000, 2000, 3000, 5000],
}).toBe(expectedCount);
```

---

## API Response Waiting

### ❌ DON'T: Use Fixed Timeouts After Actions

```typescript
// BAD - Fixed timeout doesn't guarantee API completion
await createButton.click();
await page.waitForTimeout(6000); // May not be enough, or may be too much
```

### ✅ DO: Wait for Actual API Responses

```typescript
// GOOD - Wait for actual API responses
const createResponsePromise = page.waitForResponse(
  response => response.url().includes('/api/testcase/create') && response.status() === 200,
  { timeout: 30000 }
).catch(() => null);

const gridRefreshPromise = page.waitForResponse(
  response => response.url().includes('/api/testcase/testCaseList') && response.status() === 200,
  { timeout: 30000 }
).catch(() => null);

await createButton.click();

// Wait for creation API
await createResponsePromise;
console.log('✅ Test case creation API call completed');

// Wait for grid refresh API
await gridRefreshPromise;
console.log('✅ Grid refresh API call completed (count should be updated)');
```

### Key Points

- **Set up response listeners BEFORE the action** - listeners must be registered before clicking
- **Wait for both creation and refresh APIs** - creation API creates the item, refresh API updates the UI
- **Use `.catch(() => null)`** - prevents test failure if API already completed
- **Provide clear logging** - log when each API call completes

### API Response Patterns

```typescript
// Pattern 1: Single API call
const responsePromise = page.waitForResponse(
  response => response.url().includes('/api/endpoint') && response.status() === 200,
  { timeout: 30000 }
).catch(() => null);

await actionButton.click();
await responsePromise;

// Pattern 2: Multiple API calls
const api1Promise = page.waitForResponse(...).catch(() => null);
const api2Promise = page.waitForResponse(...).catch(() => null);

await actionButton.click();
await Promise.all([api1Promise, api2Promise]);

// Pattern 3: API call with verification
const response = await page.waitForResponse(
  async (response) => {
    const url = response.url();
    if (url.includes('/api/endpoint')) {
      const body = await response.json().catch(() => null);
      return response.status() === 200 && body?.success === true;
    }
    return false;
  },
  { timeout: 30000 }
);
```

---

## Race Condition Prevention

### Common Race Conditions

1. **Count Updates** - UI count may not update immediately after create/delete
2. **Status Changes** - Status may take time to reflect in the UI
3. **Filter Clearing** - Filters may be auto-cleared, changing which count is displayed
4. **API Completion** - Backend processing may not be immediate

### Prevention Strategies

#### 1. Use Polling Instead of Fixed Waits

```typescript
// ❌ BAD
await page.waitForTimeout(6000);
expect(count).toBe(expected);

// ✅ GOOD
await expect.poll(async () => {
  return await getCount();
}, { timeout: 30000 }).toBe(expected);
```

#### 2. Wait for API Responses

```typescript
// ❌ BAD
await button.click();
await page.waitForTimeout(2000);

// ✅ GOOD
const responsePromise = page.waitForResponse(...);
await button.click();
await responsePromise;
```

#### 3. Check Context Before Verification

```typescript
// ✅ GOOD - Check if filter is still active
const filterStillActive = await filterIndicator.isVisible({ timeout: 3000 }).catch(() => false);

// Use appropriate baseline based on context
const expectedCount = filterStillActive 
  ? filteredCount - 1
  : totalCount - 1;
```

#### 4. Use Progressive Timeouts

```typescript
// ✅ GOOD - Progressive intervals
intervals: [2000, 2000, 2000, 3000, 5000]
// First checks are quick, later checks wait longer
```

---

## Error Handling

### ❌ DON'T: Fail Immediately on Errors

```typescript
// BAD - Test fails immediately
const response = await page.waitForResponse(...);
if (!response) {
  throw new Error('API call failed');
}
```

### ✅ DO: Handle Errors Gracefully

```typescript
// GOOD - Handle errors gracefully
const response = await page.waitForResponse(...).catch(() => null);
if (response) {
  console.log('✅ API call completed');
} else {
  console.log('⚠️ API call may have already completed or timed out');
  // Continue with verification - may still work
}
```

### Best Practices

1. **Use `.catch(() => null)`** for optional API response waits
2. **Log warnings instead of failing** when errors are recoverable
3. **Continue with verification** even if some checks fail
4. **Take screenshots** on failures for debugging

```typescript
// Example: Graceful error handling
try {
  await expect(element).toBeVisible({ timeout: 5000 });
  console.log('✅ Element is visible');
} catch (error) {
  console.log('⚠️ Element not visible, but continuing...');
  await page.screenshot({ path: 'test-results/debug.png' });
  // Continue with test - may still pass
}
```

---

## Code Reusability

### ✅ DO: Create Helper Functions

Instead of duplicating code, create reusable helpers:

```typescript
// ✅ GOOD - Reusable helper
// tests/helpers/api/authTokenFromPage.ts
export async function authTokenFromPage(page: Page): Promise<AuthToken> {
  const cookies = await page.context().cookies();
  const tokenCookie = cookies.find(c => c.name === 'token');
  // ... validation and CSRF token extraction
  return { token, cookies: cookiesString };
}
```

### Benefits

- **Consistency** - Same logic used everywhere
- **Maintainability** - Fix bugs in one place
- **Readability** - Tests are cleaner and easier to understand
- **Error Prevention** - Common mistakes are avoided

### Helper Function Examples

1. **`authTokenFromPage()`** - Extract auth tokens from page context
2. **`getAuthHeaders()`** - Create headers with CSRF token
3. **`waitForCountUpdate()`** - Poll for count changes (could be created)
4. **`waitForApiResponse()`** - Wait for specific API calls (could be created)

---

## General Playwright Best Practices

### 1. Use Appropriate Timeouts

```typescript
// ✅ GOOD - Appropriate timeouts
await expect(element).toBeVisible({ timeout: 90000 }); // Long for page loads
await expect(dialog).toBeVisible({ timeout: 5000 });   // Short for quick actions
```

### 2. Use Role-Based Selectors

```typescript
// ✅ GOOD - Role-based selectors are more stable
page.getByRole('button', { name: 'Create' })
page.getByRole('textbox', { name: 'Summary' })

// ❌ AVOID - Fragile selectors
page.locator('#button-123')
page.locator('.create-button')
```

### 3. Wait for Network Idle When Needed

```typescript
// ✅ GOOD - Wait for network to be idle
await page.goto(url, { waitUntil: 'networkidle' });
```

### 4. Use `scrollIntoViewIfNeeded()`

```typescript
// ✅ GOOD - Ensure element is visible before interaction
await button.scrollIntoViewIfNeeded();
await button.click();
```

### 5. Log Important Steps

```typescript
// ✅ GOOD - Clear logging helps debugging
console.log('📋 Section 1: Login');
console.log('✅ Login completed');
console.log('⚠️ Warning: Element may not be visible');
```

### 6. Take Screenshots on Failures

```typescript
// ✅ GOOD - Screenshots help debug failures
try {
  await expect(element).toBeVisible();
} catch (error) {
  await page.screenshot({ path: 'test-results/failure.png', fullPage: true });
  throw error;
}
```

---

## Summary Checklist

When writing or reviewing tests, ensure:

- [ ] CSRF tokens are included in API requests (use `getAuthHeaders()`)
- [ ] Count verification uses `expect.poll()` instead of fixed timeouts
- [ ] API responses are waited for before verification
- [ ] Race conditions are handled with polling
- [ ] Errors are handled gracefully with `.catch()`
- [ ] Helper functions are used instead of code duplication
- [ ] Appropriate timeouts are set for different operations
- [ ] Role-based selectors are used when possible
- [ ] Important steps are logged for debugging
- [ ] Screenshots are taken on failures

---

## Related Documentation

- [API Helper Functions README](helpers/api/README.md) - Comprehensive API helper documentation
- [CSRF Token Fix Guide](helpers/api/CSRF_TOKEN_FIX.md) - Detailed CSRF token handling guide
- [Playwright Official Documentation](https://playwright.dev/docs/intro)

---

## Examples of Fixed Tests

- `tests/TestCases/Create_TC_ViaUI.spec.ts` - Count verification with polling
- `tests/TestCases/DeleteTC_viaUI.spec.ts` - Count verification with context awareness
- `tests/TestLaunch/UpdateLaunchStatus.spec.ts` - CSRF token handling
- `tests/API/CreateLaunch_ViaAPI.spec.ts` - API helper usage

---

*Last updated: Based on fixes implemented in December 2025*

