// @type {import('@playwright/test').PlaywrightTestConfig}
const config = {
  retries: 2, // retry failed tests up to 2 times
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }],
    ['@alternative-path/testlens-playwright-reporter', {
      apiKey: '7f84925e03020af61d59ad96bae9816b',
      apiEndpoint: 'http://localhost:3001/api/v1/webhook/playwright',
      customMetadata: {
        testlensBuildName: 'My Test Build',
        testlensBuildTag: ['smoke', 'smoke1']
      }
    }]
  ],
  use: {
    headless: true,
    video: 'on',
    screenshot: 'on',
    trace: 'on',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  }
};

module.exports = config;
