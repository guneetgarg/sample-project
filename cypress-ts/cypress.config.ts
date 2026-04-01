import { defineConfig } from 'cypress';
import testlens from 'testlens-cypress-reporter';

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(on, config) {
      // Register TestLens reporter plugin
      const plugin = testlens({});
      return plugin(on, config);
    }
  }
});
