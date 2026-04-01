package com.testlens.sample.tests;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Sample tests for Google Search functionality
 */
public class GoogleSearchTest extends BaseTest {
    
    @Test(groups = {"smoke", "search"}, description = "Search for Selenium on Google")
    public void testGoogleSearchSelenium() {
        driver.get("https://www.google.com");
        
        // Accept cookies if present
        try {
            WebElement acceptButton = driver.findElement(By.xpath("//button[contains(., 'Accept')]"));
            acceptButton.click();
        } catch (Exception e) {
            // Cookies dialog not present, continue
        }
        
        // Find search box and search
        WebElement searchBox = driver.findElement(By.name("q"));
        searchBox.sendKeys("Selenium WebDriver");
        searchBox.sendKeys(Keys.RETURN);
        
        sleep(2000);
        
        // Verify results
        String pageTitle = driver.getTitle();
        Assert.assertTrue(pageTitle.contains("Selenium"), 
            "Page title should contain 'Selenium', but was: " + pageTitle);
    }
    
    @Test(groups = {"smoke", "search"}, description = "Search for TestNG on Google")
    public void testGoogleSearchTestNG() {
        driver.get("https://www.google.com");
        
        // Accept cookies if present
        try {
            WebElement acceptButton = driver.findElement(By.xpath("//button[contains(., 'Accept')]"));
            acceptButton.click();
        } catch (Exception e) {
            // Continue
        }
        
        WebElement searchBox = driver.findElement(By.name("q"));
        searchBox.sendKeys("TestNG Framework");
        searchBox.sendKeys(Keys.RETURN);
        
        sleep(2000);
        
        String pageTitle = driver.getTitle();
        Assert.assertTrue(pageTitle.contains("TestNG"), 
            "Page title should contain 'TestNG'");
    }
    
    @Test(groups = {"search"}, description = "Search with empty query should show search page")
    public void testEmptySearch() {
        driver.get("https://www.google.com");
        
        WebElement searchBox = driver.findElement(By.name("q"));
        searchBox.sendKeys(Keys.RETURN);
        
        sleep(1000);
        
        // Should still be on Google
        Assert.assertTrue(driver.getCurrentUrl().contains("google.com"));
    }
    
    @Test(groups = {"search", "negative"}, description = "This test should fail intentionally")
    public void testIntentionalFailure() {
        System.out.println("[Debug] testIntentionalFailure START");
        System.out.println("[Debug] driver class = " + driver.getClass().getName());
        System.out.println("[Debug] is ByteBuddy proxy = " + driver.getClass().getName().contains("ByteBuddy"));
        driver.get("https://www.google.com");
        System.out.println("[Debug] After driver.get()");
        sleep(1000);
        
        // This will fail to demonstrate failure reporting
        Assert.fail("This is an intentional failure to test TestLens error reporting");
    }
}
