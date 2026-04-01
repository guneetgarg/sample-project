import { test, expect } from '@playwright/test';

test('should fail first time and pass on retry', async ({}, testInfo) => {
  console.log('Current retry count:', testInfo.retry);
  
  if (testInfo.retry === 0) {
    // First execution → Force failure
    expect(false).toBe(true);
  }
  if (testInfo.retry === 1) {
    expect(false).toBe(true);
  }
  if (testInfo.retry === 2) {
    expect(true).toBe(true);
  }
});