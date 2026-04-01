// Insecure: disables TLS certificate verification for Node (reporter, API calls, etc.).
// Prefer fixing CA certs or NODE_EXTRA_CA_CERTS; remove in production/CI if possible.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 2,
  retries: 2,
  // Also scan for tests in the unit-tests e2e folder
  testMatch: ['**/*.spec.ts', '../../unit-tests/tests/e2e/**/*.spec.ts'],
  timeout: 9000,
  reporter: [
    ['list'], // Console output
    ['junit', { outputFile: 'results.xml' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }], // HTML report
    ['json', { outputFile: 'test-results.json' }], // JSON file
    ['@alternative-path/testlens-playwright-reporter', {
      apiKey: 'a7e388871d02cd243b1f6838a8cebcc6',
      customMetadata: {
        TL_BUILDNAME: 'TestBuild',
        TL_BUILDTAG: '@smoke'
      }
    }]
  ],
  use: {
    headless: true,
    trace: 'on',
    screenshot: 'on',
    video: 'on'
  }
});
