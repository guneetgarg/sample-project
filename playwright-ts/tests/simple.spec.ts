import { test, expect } from '@playwright/test';

test.describe('Select Test Plan and Run Test', () => {
  test('should select rahul_testplan_clicklinkbytext_usingcontains and click RUN TEST', async ({ page }) => {
    // Navigate to the test automation platform
    await page.goto('https://ap-agent.qa-path.com/test-automation/');
  });
});
