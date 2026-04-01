package com.testlens.sample.tests;

import com.testlens.reporter.TestLensListener;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

import java.time.Duration;

/**
 * Base test class with common setup and teardown
 */
public abstract class BaseTest {
    protected WebDriver driver;
    private WebDriver originalDriver; // Keep reference to original for cleanup
    
    @BeforeMethod(alwaysRun = true)
    public void setup(ITestResult result) {
        // Setup ChromeDriver using WebDriverManager
        WebDriverManager.chromedriver().setup();
        
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");
        options.addArguments("--disable-blink-features=AutomationControlled");
        
        // For headless mode (uncomment if needed)
        // options.addArguments("--headless=new");
        
        originalDriver = new ChromeDriver(options);
        originalDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        originalDriver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        
        // Register driver with TestLens for video recording and tracing
        TestLensListener.registerDriver(originalDriver);
        
        // Use the original driver initially
        driver = originalDriver;
    }
    
    /**
     * Called after TestLens listener wraps the driver
     * Get the traced driver from TestLens
     */
    @BeforeMethod(dependsOnMethods = "setup", alwaysRun = true)
    public void postSetup(ITestResult result) {
        // Check if TestLens wrapped the driver with tracing
        WebDriver tracedDriver = TestLensListener.getRegisteredDriver();
        if (tracedDriver != null && tracedDriver != originalDriver) {
            driver = tracedDriver;
            System.out.println("[Test] Using traced WebDriver from TestLens");
        }
    }
    
    @AfterMethod(alwaysRun = true)
    public void teardown(ITestResult result) {
        // Unregister driver from TestLens
        TestLensListener.unregisterDriver();
        
        // Small delay to allow any pending operations to complete
        if (originalDriver != null) {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            
            originalDriver.quit();
        }
    }
    
    protected void sleep(int milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
