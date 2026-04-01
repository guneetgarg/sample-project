import { APIRequestContext } from '@playwright/test';
import { AuthToken, getAuthHeaders } from './login';

/**
 * Interface for test case creation options
 */
export interface CreateTestCaseOptions {
  title: string;
  description?: string;
  moduleId: string;
  type?: string;
  status?: string;
  priority?: string;
  estimatedDuration?: number;
  automationStatus?: string;
  executionMode?: string;
  labels?: Array<{ id: string; name: string }>;
  projectId: string; // Required for x-project-id header
  generatedBy?: string; // User ID who generated the test case
  updatedBy?: string; // User ID who updated the test case
  testdata?: any; // Test data (can be null, object, or string)
}

/**
 * Interface for test case creation response
 */
export interface CreateTestCaseResponse {
  success: boolean;
  message?: string;
  testCase?: {
    id: string;
    key: string;
    title: string;
    description: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Creates a test case via API
 * This is faster than UI-based creation and can be used for test data creation
 * 
 * @param request - Playwright APIRequestContext (should have session cookies from login)
 * @param options - Test case creation options
 * @param authToken - Authentication token from loginViaAPI
 * @param baseUrl - Base API URL (default: https://api.qa-path.com)
 * @returns Promise<CreateTestCaseResponse> - The created test case data
 * 
 * @example
 * ```typescript
 * import { loginViaAPI } from '../helpers/api/login';
 * import { createTestCaseViaAPI } from '../helpers/api/createTestCase';
 * 
 * test('create test case via API', async ({ request }) => {
 *   // 1. Login first
 *   const { authToken, requestContext } = await loginViaAPI(request);
 *   
 *   // 2. Set project (if needed)
 *   // await setProjectViaAPI(requestContext, 'project-id', authToken);
 *   
 *   // 3. Create test case
 *   const testCase = await createTestCaseViaAPI(requestContext, {
 *     title: 'My Test Case',
 *     description: 'Test case description',
 *     moduleId: 'module-id',
 *     projectId: 'project-id',
 *     type: 'Functional Test',
 *     status: 'New',
 *     priority: 'Normal'
 *   }, authToken);
 *   
 *   console.log(`Test case created: ${testCase.testCase?.key}`);
 * });
 * ```
 */
export async function createTestCaseViaAPI(
  request: APIRequestContext,
  options: CreateTestCaseOptions,
  authToken?: AuthToken,
  baseUrl: string = 'https://api.qa-path.com'
): Promise<CreateTestCaseResponse> {
  console.log('📝 Creating test case via API...');
  console.log(`   Title: ${options.title}`);
  console.log(`   Module ID: ${options.moduleId}`);
  console.log(`   Project ID: ${options.projectId}`);

  const payload: any = {
    title: options.title,
    module_id: options.moduleId,
    type: options.type || 'Functional Test',
    status: options.status || 'New',
    priority: options.priority || 'Normal',
    estimated_duration: options.estimatedDuration || 15,
    automation_status: options.automationStatus || 'Not Automated',
    execution_mode: options.executionMode || 'Manual',
  };
  
  // Add testdata only if provided (frontend sends null explicitly)
  if (options.testdata !== undefined) {
    payload.testdata = options.testdata;
  } else {
    // Default to null if not provided (frontend sends this)
    payload.testdata = null;
  }

  // Add user IDs if provided (backend can also get from session, but including for clarity)
  if (options.generatedBy) {
    payload.generated_by = options.generatedBy;
  }
  if (options.updatedBy) {
    payload.updated_by = options.updatedBy;
  }

  // Add optional fields
  if (options.description) {
    // Description can be plain text or HTML (from rich text editor)
    // The backend accepts HTML, so we can wrap plain text in <p> tags if needed
    payload.description = options.description.startsWith('<') 
      ? options.description 
      : `<p>${options.description}</p>`;
  }

  if (options.labels && options.labels.length > 0) {
    payload.labels = options.labels;
  }

  // Start with base headers
  const headers: Record<string, string> = {
    'x-project-id': options.projectId, // Required for permission checks
    'Content-Type': 'application/json',
  };
  
  // IMPORTANT: Always use getAuthHeaders() to ensure CSRF token is included
  // When using page.request, cookies are automatically included, but CSRF token header must be explicit
  if (authToken) {
    const authHeaders = getAuthHeaders(authToken);
    // Merge auth headers (includes Cookie and X-CSRF-Token)
    Object.assign(headers, authHeaders);
  } else {
    console.warn('⚠️ No authToken provided. API call may fail without authentication and CSRF token.');
  }

  const response = await request.post(`${baseUrl}/api/testcase/create`, {
    data: payload,
    headers,
    ignoreHTTPSErrors: true, // Ignore SSL certificate errors for QA environment
  });

  if (!response.ok()) {
    let errorText = '';
    try {
      const errorJson = await response.json();
      errorText = JSON.stringify(errorJson, null, 2);
      console.error('   ❌ Failed to create test case');
      console.error(`   Status: ${response.status()}`);
      console.error(`   Error Response: ${errorText}`);
      console.error(`   Payload sent: ${JSON.stringify(payload, null, 2)}`);
    } catch {
      errorText = await response.text();
      console.error('   ❌ Failed to create test case');
      console.error(`   Status: ${response.status()}`);
      console.error(`   Error: ${errorText}`);
      console.error(`   Payload sent: ${JSON.stringify(payload, null, 2)}`);
    }
    throw new Error(`Failed to create test case: ${response.status()} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log('   ✅ Test case created successfully');
  
  // The backend returns the test case directly, not wrapped in a success/testCase object
  // Check if it's the direct test case object or wrapped
  let testCase: any;
  if (responseData.testCase) {
    // Wrapped format
    testCase = responseData.testCase;
  } else if (responseData.id && responseData.key) {
    // Direct format (what backend actually returns)
    testCase = responseData;
  } else {
    testCase = responseData;
  }
  
  if (testCase) {
    console.log(`   Test Case ID: ${testCase.id}`);
    console.log(`   Test Case Key: ${testCase.key}`);
  }

  // Return in a consistent format
  return {
    success: true,
    testCase: testCase,
    ...responseData,
  } as CreateTestCaseResponse;
}

