# TestLens Selenium Java Sample Project

This is a sample Selenium + TestNG project demonstrating integration with TestLens Reporter.

## Prerequisites

- Java 11 or higher
- Maven 3.6+
- Chrome browser installed

## Setup

1. **Clone or navigate to this directory**

2. **Build the TestLens reporter (if not already built)**
   ```bash
   cd ../testlens_playwright_reporter/selenium_java_package
   mvn clean install
   cd ../../AAA_playwright-projects/selenium-java
   ```

3. **Set your TestLens API Key**
   ```bash
   # Windows PowerShell
   $env:TESTLENS_API_KEY="your_api_key_here"
   
   # Linux/Mac
   export TESTLENS_API_KEY="your_api_key_here"
   ```

4. **Optional: Set TestLens endpoint (for local development)**
   ```bash
   # Windows PowerShell
   $env:TESTLENS_API_ENDPOINT="http://localhost:3001/api/v1/webhook/selenium"
   
   # Linux/Mac
   export TESTLENS_API_ENDPOINT="http://localhost:3001/api/v1/webhook/selenium"
   ```

## Running Tests

### Run all tests
```bash
mvn clean test
```

### Run specific test class
```bash
mvn test -Dtest=GoogleSearchTest
```

### Run with specific groups
```bash
mvn test -Dgroups="smoke"
```

### Run with custom metadata
```bash
# Windows PowerShell
$env:TESTLENS_BUILD_TAG="v1.0.0"
$env:ENVIRONMENT="dev"
$env:TEAM="QA-Team"
mvn clean test

# Linux/Mac
TESTLENS_BUILD_TAG=v1.0.0 ENVIRONMENT=dev TEAM=QA-Team mvn clean test
```

## Project Structure

```
selenium-java/
├── pom.xml                          # Maven configuration
├── testng.xml                       # TestNG suite configuration
├── README.md                        # This file
└── src/
    └── test/
        └── java/
            └── com/
                └── testlens/
                    └── sample/
                        └── tests/
                            ├── BaseTest.java          # Base test class
                            ├── GoogleSearchTest.java  # Search tests
                            ├── FormTest.java          # Form interaction tests
                            └── NavigationTest.java    # Navigation tests
```

## Test Suites

### GoogleSearchTest
- `testGoogleSearchSelenium` - Search for Selenium on Google
- `testGoogleSearchTestNG` - Search for TestNG on Google
- `testEmptySearch` - Test empty search behavior
- `testIntentionalFailure` - Demonstrates failure reporting

### FormTest
- `testFormSubmission` - Fill and submit form
- `testDropdownSelection` - Test dropdown interactions
- `testCheckboxes` - Test checkbox interactions
- `testRadioButtons` - Test radio button selection

### NavigationTest
- `testNavigationBackForward` - Test browser navigation
- `testPageRefresh` - Test page refresh
- `testMultipleTabs` - Test multiple tab handling
- `testScrolling` - Test scrolling behavior

## Configuration

### TestNG Configuration (testng.xml)

The `testng.xml` file configures:
- Parallel execution (methods level, 2 threads)
- TestLens listener registration
- Test classes to run

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TESTLENS_API_KEY` | Your TestLens API key | Yes |
| `TESTLENS_API_ENDPOINT` | TestLens webhook URL | No (defaults to production) |
| `TESTLENS_BUILD_TAG` | Build tag for grouping | No |
| `ENVIRONMENT` | Environment name (dev/staging/prod) | No |
| `TEAM` | Team name | No |

## Viewing Results

After running tests:

1. Open TestLens dashboard: https://testlens.qa-path.com
2. Navigate to your project
3. View test results, screenshots, and execution traces

## Troubleshooting

### ChromeDriver not found
The project uses WebDriverManager which automatically downloads the correct ChromeDriver. Ensure you have internet connection on first run.

### API Key Error
```
Error: TESTLENS_API_KEY is required
```
Make sure you've set the `TESTLENS_API_KEY` environment variable.

### SSL Certificate Errors (Local Development)
```bash
# For local development only
$env:TESTLENS_REJECT_UNAUTHORIZED="false"
```

### Tests not appearing in TestLens
- Verify API key is correct
- Check network connectivity
- Ensure TestLens endpoint is accessible

## Features Demonstrated

✅ TestNG integration
✅ Parallel test execution
✅ Screenshot capture on failure
✅ Test grouping and tags
✅ Page navigation
✅ Form interactions
✅ Multiple window handling
✅ Real-time reporting to TestLens

## Next Steps

1. Customize tests for your application
2. Add more test groups
3. Configure CI/CD integration
4. Set up S3 for artifact storage
5. Add custom metadata

## Support

For issues or questions:
- Email: support@alternative-path.com
- Documentation: https://docs.testlens.qa-path.com
