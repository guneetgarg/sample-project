const { defineConfig } = require('cypress');
const testlens = require('testlens-cypress-reporter').default;

module.exports = defineConfig({
    // "projectId": "t85p7p",
    video: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    e2e: {
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        setupNodeEvents(on, config) {
            // Register TestLens reporter plugin with configuration (includes tracer)
            const plugin = testlens({
                // API key - can also be set via TESTLENS_API_KEY env var
                apiKey: '4ca0a2ad1619e3f00cc3a780c314890c',
                
                // Optional: Custom API endpoint (defaults to TestLens cloud)
                apiEndpoint: 'http://localhost:3001/api/v1/webhook/cypress',
                
                // Optional: Enable/disable features
                enableRealTimeStream: true,  // Stream results in real-time
                enableGitInfo: true,          // Collect git branch/commit info
                enableArtifacts: true,        // Upload screenshots/videos
                enableS3Upload: true,         // Upload artifacts to S3
                
                // Enable execution tracing
                enableTracing: true,
                tracerOutputDir: 'testlens-traces',
                
                // Optional: Custom metadata
                customMetadata: {
                    testlensBuildName: process.env.testlensBuildName || 'Cypress JS Tests',
                    testlensBuildTag: process.env.testlensBuildTag || 'smoke',
                    environment: process.env.ENVIRONMENT || 'development',
                    team: 'QA Team'
                },
            });
            return plugin(on, config);
        }
    }
});
