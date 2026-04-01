package com.testlens.sample.tests;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Sample tests for form interactions
 */
public class FormTest extends BaseTest {
    
    private static final String FORM_URL = "https://www.selenium.dev/selenium/web/web-form.html";
    
    @Test(groups = {"forms", "smoke"}, description = "Fill and submit a web form")
    public void testFormSubmission() {
        driver.get(FORM_URL);
        
        // Fill text input
        WebElement textInput = driver.findElement(By.id("my-text-id"));
        textInput.sendKeys("TestLens Selenium Reporter");
        
        // Fill password
        WebElement passwordInput = driver.findElement(By.name("my-password"));
        passwordInput.sendKeys("SecurePassword123");
        
        // Fill textarea
        WebElement textarea = driver.findElement(By.name("my-textarea"));
        textarea.sendKeys("This is a sample test using TestLens reporter for Selenium");
        
        sleep(1000);
        
        // Submit form
        WebElement submitButton = driver.findElement(By.cssSelector("button[type='submit']"));
        submitButton.click();
        
        sleep(2000);
        
        // Verify submission
        String currentUrl = driver.getCurrentUrl();
        Assert.assertTrue(currentUrl.contains("submitted"), 
            "URL should contain 'submitted' after form submission");
    }
    
    @Test(groups = {"forms"}, description = "Test dropdown selection")
    public void testDropdownSelection() {
        driver.get(FORM_URL);
        
        // Find and select from dropdown
        WebElement dropdown = driver.findElement(By.name("my-select"));
        Select select = new Select(dropdown);
        
        // Select by visible text
        select.selectByIndex(2);
        
        sleep(1000);
        
        // Verify selection
        String selectedValue = select.getFirstSelectedOption().getText();
        Assert.assertNotNull(selectedValue, "A dropdown option should be selected");
    }
    
    @Test(groups = {"forms"}, description = "Test checkbox interactions")
    public void testCheckboxes() {
        driver.get(FORM_URL);
        
        // Find checkbox
        WebElement checkbox1 = driver.findElement(By.id("my-check-1"));
        WebElement checkbox2 = driver.findElement(By.id("my-check-2"));
        
        // Check both checkboxes
        if (!checkbox1.isSelected()) {
            checkbox1.click();
        }
        if (!checkbox2.isSelected()) {
            checkbox2.click();
        }
        
        sleep(500);
        
        // Verify
        Assert.assertTrue(checkbox1.isSelected(), "Checkbox 1 should be checked");
        Assert.assertTrue(checkbox2.isSelected(), "Checkbox 2 should be checked");
    }
    
    @Test(groups = {"forms"}, description = "Test radio button selection")
    public void testRadioButtons() {
        driver.get(FORM_URL);
        
        // Find and select radio button
        WebElement radio1 = driver.findElement(By.id("my-radio-1"));
        WebElement radio2 = driver.findElement(By.id("my-radio-2"));
        
        radio1.click();
        sleep(300);
        Assert.assertTrue(radio1.isSelected(), "Radio 1 should be selected");
        
        radio2.click();
        sleep(300);
        Assert.assertTrue(radio2.isSelected(), "Radio 2 should be selected");
        Assert.assertFalse(radio1.isSelected(), "Radio 1 should not be selected");
    }
}
