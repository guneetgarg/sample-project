package com.testlens.sample.tests;

import com.testlens.reporter.TestLensConfig;
import com.testlens.reporter.TraceRecorder;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.Assert;
import org.testng.ITestContext;
import org.testng.ITestResult;
import org.testng.Reporter;
import org.testng.annotations.*;

import java.lang.reflect.Method;

/**
 * Example test demonstrating comprehensive trace recording
 * with automatic action capture (Playwright-level tracing)
 */
public class GoogleSearchTracedTest {
    
    private WebDriver driver;
    private static TraceRecorder traceRecorder;
    
    @BeforeClass
    public static void setupTracer() {
        // Initialize trace recorder once per test class
        TestLensConfig config = new TestLensConfig();
        traceRecorder = new TraceRecorder(config);
        System.out.println("[TRACED TEST] TraceRecorder initialized for comprehensive tracing");
    }
    
    @BeforeMethod
    public void setup(ITestContext context, Method method) {
        System.out.println("[TRACED TEST] Setting up traced driver for: " + method.getName());
        
        // Create base WebDriver
        WebDriver baseDriver = new ChromeDriver();
        
        // Get test ID
        String testId = getClass().getName() + " › " + method.getName();
        
        // Wrap driver with automatic tracing - this captures EVERY action!
        driver = traceRecorder.createTracedDriver(baseDriver, testId);
        
        // Store driver in TestNG context so the reporter can access it
        ITestResult result = Reporter.getCurrentTestResult();
        result.setAttribute("driver", driver);
        
        System.out.println("[TRACED TEST] Driver wrapped with automatic action recording");
    }
    
    @Test(groups = {"search", "smoke", "traced"})
    public void testGoogleSearchWithTracing() {
        System.out.println("[TRACED TEST] Starting test - all actions will be automatically recorded");
        
        // Navigate - automatically recorded in trace
        driver.get("https://www.google.com");
        
        // Type in search box - automatically recorded
        driver.findElement(By.name("q")).sendKeys("Selenium WebDriver");
        
        // Submit form - automatically recorded
        driver.findElement(By.name("q")).submit();
        
        // Wait for results
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Verify - the trace will show all steps leading up to this assertion
        String title = driver.getTitle();
        System.out.println("[TRACED TEST] Page title: " + title);
        Assert.assertTrue(title.contains("Selenium WebDriver"), 
            "Title should contain search query");
        
        System.out.println("[TRACED TEST] Test completed - comprehensive trace generated with all actions");
    }
    
    @Test(groups = {"search", "traced"})
    public void testGoogleSearchEmptyWithTracing() {
        System.out.println("[TRACED TEST] Testing empty search with full tracing");
        
        // Navigate
        driver.get("https://www.google.com");
        
        // Click search without entering text
        driver.findElement(By.name("q")).submit();
        
        // Wait
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Verify still on Google search page
        String currentUrl = driver.getCurrentUrl();
        System.out.println("[TRACED TEST] Current URL: " + currentUrl);
        Assert.assertTrue(currentUrl.contains("google.com"), 
            "Should remain on Google search page");
        
        System.out.println("[TRACED TEST] Empty search test completed with full trace");
    }
    
    @AfterMethod
    public void teardown() {
        if (driver != null) {
            System.out.println("[TRACED TEST] Closing driver - trace will be finalized automatically");
            driver.quit();
        }
    }
}
