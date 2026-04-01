package com.testlens.sample.tests;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.util.ArrayList;
import java.util.List;

/**
 * Sample tests for navigation and page interactions
 */
public class NavigationTest extends BaseTest {
    
    @Test(groups = {"navigation", "smoke"}, description = "Test page navigation and back button")
    public void testNavigationBackForward() {
        driver.get("https://www.selenium.dev/");
        String firstPageTitle = driver.getTitle();
        
        sleep(1000);
        
        // Navigate to downloads
        driver.get("https://www.selenium.dev/downloads/");
        String secondPageTitle = driver.getTitle();
        
        sleep(1000);
        
        // Go back
        driver.navigate().back();
        sleep(1000);
        
        Assert.assertEquals(driver.getTitle(), firstPageTitle, 
            "Should be back on first page");
        
        // Go forward
        driver.navigate().forward();
        sleep(1000);
        
        Assert.assertEquals(driver.getTitle(), secondPageTitle, 
            "Should be forward on second page");
    }
    
    @Test(groups = {"navigation"}, description = "Test page refresh")
    public void testPageRefresh() {
        driver.get("https://www.selenium.dev/");
        String originalUrl = driver.getCurrentUrl();
        
        sleep(1000);
        
        driver.navigate().refresh();
        sleep(1000);
        
        Assert.assertEquals(driver.getCurrentUrl(), originalUrl, 
            "URL should remain same after refresh");
    }
    
    @Test(groups = {"navigation"}, description = "Test multiple tab handling")
    public void testMultipleTabs() {
        driver.get("https://www.selenium.dev/");
        String originalWindow = driver.getWindowHandle();
        
        // Open new tab (via JavaScript)
        ((org.openqa.selenium.JavascriptExecutor) driver)
            .executeScript("window.open('https://www.selenium.dev/documentation/', '_blank');");
        
        sleep(2000);
        
        // Switch to new tab
        List<String> windows = new ArrayList<>(driver.getWindowHandles());
        Assert.assertEquals(windows.size(), 2, "Should have 2 windows open");
        
        driver.switchTo().window(windows.get(1));
        sleep(1000);
        
        Assert.assertTrue(driver.getCurrentUrl().contains("documentation"), 
            "Should be on documentation page");
        
        // Close new tab and switch back
        driver.close();
        driver.switchTo().window(originalWindow);
        
        Assert.assertEquals(driver.getWindowHandles().size(), 1, 
            "Should have only 1 window after closing");
    }
    
    @Test(groups = {"navigation"}, description = "Test scrolling behavior")
    public void testScrolling() {
        driver.get("https://www.selenium.dev/");
        
        // Scroll down
        ((org.openqa.selenium.JavascriptExecutor) driver)
            .executeScript("window.scrollTo(0, document.body.scrollHeight)");
        
        sleep(1000);
        
        // Scroll back to top
        ((org.openqa.selenium.JavascriptExecutor) driver)
            .executeScript("window.scrollTo(0, 0)");
        
        sleep(500);
        
        Assert.assertTrue(true, "Scrolling test completed");
    }
}
