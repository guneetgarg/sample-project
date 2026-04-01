import { Page, expect } from '@playwright/test';

/**
 * Failure Injector Utility
 * 
 * Provides functions to inject realistic, random failures into test scripts.
 * Each failure type simulates a real-world error condition that could occur
 * during automated testing.
 * 
 * Usage:
 *   import { injectRandomFailure, injectFailureAtPoint } from '../helpers/failureInjector';
 *   
 *   // Inject a random failure with 40% probability
 *   await injectRandomFailure(page, 'after-login', 0.4);
 *   
 *   // Inject a specific failure type
 *   await injectFailureAtPoint(page, 'element-not-found');
 */

// ============================================
// FAILURE TYPE DEFINITIONS
// ============================================

export type FailureType =
    | 'element-not-found'
    | 'element-not-visible'
    | 'assertion-failure'
    | 'api-failure'
    | 'network-failure'
    | 'timeout-exception'
    | 'stale-element'
    | 'element-not-interactable'
    | 'navigation-timeout'
    | 'javascript-exception'
    | 'unexpected-alert'
    | 'frame-detached'
    | 'connection-refused';

const ALL_FAILURE_TYPES: FailureType[] = [
    'element-not-found',
    'element-not-visible',
    'assertion-failure',
    'api-failure',
    'network-failure',
    'timeout-exception',
    'stale-element',
    'element-not-interactable',
    'navigation-timeout',
    'javascript-exception',
    'unexpected-alert',
    'frame-detached',
    'connection-refused',
];

// ============================================
// RANDOM UTILITY FUNCTIONS
// ============================================

/**
 * Returns true with the given probability (0.0 to 1.0)
 */
function shouldFail(probability: number): boolean {
    return Math.random() < probability;
}

/**
 * Pick a random failure type from the available types
 */
function pickRandomFailureType(allowedTypes?: FailureType[]): FailureType {
    const types = allowedTypes || ALL_FAILURE_TYPES;
    return types[Math.floor(Math.random() * types.length)];
}

/**
 * Generate a random fake selector for error messages
 */
function randomSelector(): string {
    const selectors = [
        '#submit-btn-primary',
        '[data-testid="modal-confirm"]',
        '.MuiButton-containedPrimary',
        'button[aria-label="Save changes"]',
        '#dropdown-menu-item-3',
        '[role="dialog"] >> text=Confirm',
        '.ant-table-row:nth-child(2)',
        'input[name="searchField"]',
        '#loading-spinner-overlay',
        '[data-qa="action-toolbar"] button:first-child',
        '.react-select__control',
        'div.modal-backdrop + .modal-content',
        '[aria-expanded="true"] >> li:nth-child(3)',
        'table tbody tr:first-child td:nth-child(2)',
        '#notification-toast-container .toast-message',
    ];
    return selectors[Math.floor(Math.random() * selectors.length)];
}

/**
 * Generate a random URL for error messages
 */
function randomApiUrl(): string {
    const urls = [
        'https://qa-path.com/api/testcase/list',
        'https://qa-path.com/api/testgroup/create',
        'https://qa-path.com/api/auth/session',
        'https://qa-path.com/api/testlaunch/status',
        'https://qa-path.com/api/module/getAll',
        'https://qa-path.com/api/testcaseAutomation/execute',
        'https://qa-path.com/api/project/settings',
        'https://qa-path.com/api/user/preferences',
    ];
    return urls[Math.floor(Math.random() * urls.length)];
}

// ============================================
// INDIVIDUAL FAILURE IMPLEMENTATIONS
// ============================================

/**
 * Simulate: Element not found (NoSuchElementException)
 * Tries to interact with a non-existent element
 */
async function failElementNotFound(page: Page): Promise<void> {
    const selector = randomSelector();
    console.log(`💥 [INJECTED FAILURE] Attempting to find element: ${selector}`);

    // Actually try to find a non-existent element with a very short timeout
    const element = page.locator(`#__nonexistent_element_${Date.now()}_injected`);
    await expect(element).toBeVisible({ timeout: 2000 });
}

/**
 * Simulate: Element not visible
 * Asserts visibility on a hidden/non-existent element
 */
async function failElementNotVisible(page: Page): Promise<void> {
    const selector = randomSelector();
    console.log(`💥 [INJECTED FAILURE] Waiting for element to be visible: ${selector}`);

    // Try to assert visibility on an element that doesn't exist
    await expect(page.locator(`div[data-injected-test="nonexistent-${Date.now()}"]`))
        .toBeVisible({ timeout: 2000 });
}

/**
 * Simulate: Assertion failure
 * Makes a deliberately wrong assertion
 */
async function failAssertion(page: Page): Promise<void> {
    const assertions = [
        async () => {
            console.log('💥 [INJECTED FAILURE] Asserting page title matches expected value...');
            await expect(page).toHaveTitle('Expected Title That Does Not Match - Injected Failure', { timeout: 2000 });
        },
        async () => {
            console.log('💥 [INJECTED FAILURE] Asserting URL contains expected path...');
            await expect(page).toHaveURL(/\/nonexistent-page-path-injected-failure\//, { timeout: 2000 });
        },
        async () => {
            console.log('💥 [INJECTED FAILURE] Asserting expected text is present on page...');
            await expect(page.getByText('This text absolutely does not exist on the page - injected failure')).toBeVisible({ timeout: 2000 });
        },
        async () => {
            console.log('💥 [INJECTED FAILURE] Asserting element count matches expected value...');
            const count = await page.locator('.MuiDataGrid-row').count();
            expect(count).toBe(count + 999); // Always fails
        },
        async () => {
            console.log('💥 [INJECTED FAILURE] Asserting checkbox is checked...');
            await expect(page.locator(`input[type="checkbox"][data-injected="${Date.now()}"]`)).toBeChecked({ timeout: 2000 });
        },
    ];

    const randomAssertion = assertions[Math.floor(Math.random() * assertions.length)];
    await randomAssertion();
}

/**
 * Simulate: API failure
 * Intercepts an API call and returns a failure response
 */
async function failApiCall(page: Page): Promise<void> {
    const apiUrl = randomApiUrl();
    const statusCodes = [500, 502, 503, 504, 400, 403, 429];
    const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];

    console.log(`💥 [INJECTED FAILURE] Intercepting API call to simulate ${statusCode} error...`);

    // Set up a route to intercept the next API call and make it fail
    await page.route('**/api/**', async (route) => {
        await route.fulfill({
            status: statusCode,
            contentType: 'application/json',
            body: JSON.stringify({
                error: `Injected API failure - HTTP ${statusCode}`,
                message: `Simulated server error for testing purposes`,
                statusCode: statusCode,
            }),
        });
    });

    // Now make a request that will be intercepted
    const response = await page.evaluate(async (url) => {
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return { status: res.status, ok: res.ok };
    }, apiUrl);

    // Clean up the route
    await page.unroute('**/api/**');

    // Assert the API call succeeded (it won't, causing failure)
    expect(response.status).toBe(200);
}

/**
 * Simulate: Network failure
 * Aborts network requests to simulate network issues
 */
async function failNetwork(page: Page): Promise<void> {
    console.log('💥 [INJECTED FAILURE] Simulating network connection failure...');

    // Set up route to abort all requests
    await page.route('**/*', async (route) => {
        await route.abort('connectionrefused');
    });

    // Try to navigate or make a request that will fail
    try {
        await page.evaluate(async () => {
            const res = await fetch('/api/health-check', { signal: AbortSignal.timeout(3000) });
            return res.status;
        });
    } catch (e) {
        // Expected - network was blocked
    }

    // Clean up the route
    await page.unroute('**/*');

    // Fail with a network error message
    throw new Error('net::ERR_CONNECTION_REFUSED - Failed to establish connection to the server. The network request was blocked or the server is unreachable.');
}

/**
 * Simulate: Timeout exception
 * Creates a waiting condition that times out
 */
async function failTimeout(page: Page): Promise<void> {
    const selector = randomSelector();
    console.log(`💥 [INJECTED FAILURE] Waiting for condition that will timeout: ${selector}`);

    // Wait for a response that will never come
    await page.waitForResponse(
        (response) => response.url().includes(`/api/nonexistent-endpoint-${Date.now()}`),
        { timeout: 2000 }
    );
}

/**
 * Simulate: Stale element reference
 * Interacts with an element after the page context has changed
 */
async function failStaleElement(page: Page): Promise<void> {
    console.log('💥 [INJECTED FAILURE] Simulating stale element reference...');

    // Get a reference to an element, then try to interact after simulating a page change
    const element = page.locator('body');

    // Inject a temporary element, get reference, remove it, then try to interact
    await page.evaluate(() => {
        const div = document.createElement('div');
        div.id = '__temp_stale_element__';
        div.textContent = 'Temporary Element';
        document.body.appendChild(div);
    });

    const tempElement = page.locator('#__temp_stale_element__');
    await expect(tempElement).toBeVisible({ timeout: 5000 });

    // Remove the element (simulating staleness)
    await page.evaluate(() => {
        const el = document.getElementById('__temp_stale_element__');
        if (el) el.remove();
    });

    // Wait a bit then try to click the now-removed element
    await page.waitForTimeout(100);

    // This will fail because element is gone
    throw new Error(
        'StaleElementReferenceError: stale element reference: element is not attached to the page document. ' +
        'The element was found initially but has since been removed from the DOM or the page has been refreshed.'
    );
}

/**
 * Simulate: Element not interactable
 * Tries to interact with an element that is disabled or covered
 */
async function failElementNotInteractable(page: Page): Promise<void> {
    console.log('💥 [INJECTED FAILURE] Simulating element not interactable...');

    // Create an overlay that covers everything, making elements non-interactable
    await page.evaluate(() => {
        const overlay = document.createElement('div');
        overlay.id = '__blocking_overlay__';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:transparent;pointer-events:all;';
        document.body.appendChild(overlay);
    });

    // Try to click a button through the overlay
    try {
        await page.click('button:visible', { timeout: 2000, force: false });
    } catch (e) {
        // Clean up overlay
        await page.evaluate(() => {
            const el = document.getElementById('__blocking_overlay__');
            if (el) el.remove();
        });
        throw new Error(
            'ElementNotInteractableException: element is not interactable. ' +
            'The element exists in the DOM but is covered by another element or is disabled. ' +
            'Element <button> is not clickable at point (450, 320). Other element would receive the click: <div id="__blocking_overlay__">'
        );
    }

    // Clean up overlay
    await page.evaluate(() => {
        const el = document.getElementById('__blocking_overlay__');
        if (el) el.remove();
    });
}

/**
 * Simulate: Navigation timeout exceeded
 * Navigates to a URL that will timeout
 */
async function failNavigationTimeout(page: Page): Promise<void> {
    console.log('💥 [INJECTED FAILURE] Simulating navigation timeout...');

    // Block all navigations to simulate a timeout
    await page.route('**/nonexistent-page-timeout/**', async (route) => {
        // Don't respond - this will cause a timeout
        await new Promise(resolve => setTimeout(resolve, 5000));
        await route.abort('timedout');
    });

    try {
        await page.goto('https://qa-path.com/nonexistent-page-timeout/injected', {
            timeout: 3000,
            waitUntil: 'load',
        });
    } catch (e) {
        await page.unroute('**/nonexistent-page-timeout/**');
        throw new Error(
            'Navigation timeout exceeded: Timed out after 3000ms waiting for navigation to "https://qa-path.com/nonexistent-page-timeout/injected". ' +
            'The page did not finish loading within the specified timeout. This may be caused by slow network, unresponsive server, or infinite redirects.'
        );
    }

    await page.unroute('**/nonexistent-page-timeout/**');
}

/**
 * Simulate: JavaScript exception
 * Executes JavaScript that throws an error
 */
async function failJavaScript(page: Page): Promise<void> {
    console.log('💥 [INJECTED FAILURE] Simulating JavaScript exception in page context...');

    const jsErrors = [
        `throw new TypeError("Cannot read properties of undefined (reading 'map')")`,
        `throw new ReferenceError("component is not defined")`,
        `throw new RangeError("Maximum call stack size exceeded")`,
        `throw new Error("Uncaught (in promise): ChunkLoadError: Loading chunk 7 failed.")`,
        `throw new SyntaxError("Unexpected token '<', \\"<!DOCTYPE \\"... is not valid JSON")`,
    ];

    const randomError = jsErrors[Math.floor(Math.random() * jsErrors.length)];

    await page.evaluate((errorScript) => {
        eval(errorScript);
    }, randomError);
}

/**
 * Simulate: Unexpected alert
 * Shows an alert dialog that blocks execution
 */
async function failUnexpectedAlert(page: Page): Promise<void> {
    console.log('💥 [INJECTED FAILURE] Simulating unexpected alert dialog...');

    throw new Error(
        'UnexpectedAlertOpenException: unexpected alert open: {Alert text: Session expired. Please login again.}. ' +
        'An unexpected modal dialog appeared that was not handled by the test script.'
    );
}

/**
 * Simulate: Frame detached
 * Simulates an iframe being detached
 */
async function failFrameDetached(page: Page): Promise<void> {
    console.log('💥 [INJECTED FAILURE] Simulating frame detached error...');

    throw new Error(
        'FrameDetachedError: Frame was detached. The execution context was destroyed, most likely because of a navigation. ' +
        'Cannot perform actions on a detached frame.'
    );
}

/**
 * Simulate: Connection refused
 */
async function failConnectionRefused(page: Page): Promise<void> {
    console.log('💥 [INJECTED FAILURE] Simulating connection refused error...');

    throw new Error(
        'net::ERR_CONNECTION_REFUSED at https://qa-path.com/api/testcase/list. ' +
        'The server actively refused the connection. This could be due to the server being down, ' +
        'firewall blocking, or incorrect port configuration.'
    );
}

// ============================================
// FAILURE EXECUTION MAP
// ============================================

const FAILURE_MAP: Record<FailureType, (page: Page) => Promise<void>> = {
    'element-not-found': failElementNotFound,
    'element-not-visible': failElementNotVisible,
    'assertion-failure': failAssertion,
    'api-failure': failApiCall,
    'network-failure': failNetwork,
    'timeout-exception': failTimeout,
    'stale-element': failStaleElement,
    'element-not-interactable': failElementNotInteractable,
    'navigation-timeout': failNavigationTimeout,
    'javascript-exception': failJavaScript,
    'unexpected-alert': failUnexpectedAlert,
    'frame-detached': failFrameDetached,
    'connection-refused': failConnectionRefused,
};

// ============================================
// PUBLIC API
// ============================================

/**
 * Inject a random failure at the current point in the test with the given probability.
 * 
 * @param page - Playwright Page object
 * @param injectionPoint - A label for logging (e.g., 'after-login', 'before-submit')
 * @param probability - Probability of failure (0.0 to 1.0). Default: 0.3 (30%)
 * @param allowedTypes - Optional array of specific failure types to choose from
 */
export async function injectRandomFailure(
    page: Page,
    injectionPoint: string,
    probability: number = 0.3,
    allowedTypes?: FailureType[]
): Promise<void> {
    if (!shouldFail(probability)) {
        return; // No failure this time
    }

    const failureType = pickRandomFailureType(allowedTypes);
    console.log(`\n⚠️ ======================================`);
    console.log(`⚠️ FAILURE INJECTION TRIGGERED`);
    console.log(`⚠️ Point: ${injectionPoint}`);
    console.log(`⚠️ Type: ${failureType}`);
    console.log(`⚠️ ======================================\n`);

    const failureFunction = FAILURE_MAP[failureType];
    await failureFunction(page);
}

/**
 * Inject a specific failure type at the current point in the test.
 * This always triggers (no probability check).
 * 
 * @param page - Playwright Page object
 * @param failureType - The specific type of failure to inject
 */
export async function injectFailureAtPoint(
    page: Page,
    failureType: FailureType
): Promise<void> {
    console.log(`\n⚠️ ======================================`);
    console.log(`⚠️ SPECIFIC FAILURE INJECTION`);
    console.log(`⚠️ Type: ${failureType}`);
    console.log(`⚠️ ======================================\n`);

    const failureFunction = FAILURE_MAP[failureType];
    await failureFunction(page);
}

/**
 * Inject multiple failure points throughout a test. 
 * At each point, there's a chance of failure. The first point to trigger
 * will cause the test to fail (subsequent points won't be reached).
 * 
 * @param page - Playwright Page object
 * @param injectionPoint - A label for this injection point
 * @param probability - Probability of failure at this specific point (0.0 to 1.0)
 * @param preferredTypes - Optional preferred failure types for this injection point
 */
export async function maybeFailAt(
    page: Page,
    injectionPoint: string,
    probability: number = 0.25,
    preferredTypes?: FailureType[]
): Promise<void> {
    await injectRandomFailure(page, injectionPoint, probability, preferredTypes);
}

/**
 * Get a random subset of failure types appropriate for different test phases
 */
export function getFailureTypesForPhase(phase: 'setup' | 'action' | 'navigation' | 'verification' | 'api'): FailureType[] {
    switch (phase) {
        case 'setup':
            return ['element-not-found', 'timeout-exception', 'connection-refused', 'navigation-timeout'];
        case 'action':
            return ['element-not-found', 'element-not-visible', 'element-not-interactable', 'stale-element', 'javascript-exception'];
        case 'navigation':
            return ['navigation-timeout', 'timeout-exception', 'connection-refused', 'frame-detached'];
        case 'verification':
            return ['assertion-failure', 'element-not-found', 'element-not-visible', 'stale-element', 'timeout-exception'];
        case 'api':
            return ['api-failure', 'network-failure', 'timeout-exception', 'connection-refused'];
        default:
            return ALL_FAILURE_TYPES;
    }
}
