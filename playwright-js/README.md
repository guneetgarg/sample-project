# AAA Playwright Sample Project

This is a minimal Playwright (JS) sample project to run tests locally.

Setup:

```bash
cd AAA_playwright-projects/js
npm install
# install browser binaries
npx playwright install

# run tests
npm test

# view HTML report
npm run test:report
```

Notes:
- Uses `@playwright/test` in devDependencies.
- Tests are in `tests/` directory.
- Report output: `playwright-report/`.
