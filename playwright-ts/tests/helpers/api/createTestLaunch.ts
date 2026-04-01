import { APIRequestContext } from '@playwright/test';
import { AuthToken, getAuthHeaders } from './login';

/**
 * Interface for creating a test launch via API
 */
export interface CreateTestLaunchOptions {
  testGroupId: string;
  launchName?: string;
  aiModelId?: string;
  environmentId?: string;
  startTime?: 'immediate' | 'schedule';
  scheduledTime?: string;
  projectId?: string; // Optional project ID for x-project-id header
}

/**
 * Interface for the API response
 */
export interface TestLaunchResponse {
  id: string;
  launchName: string;
  status: string;
  testGroupId: string;
  [key: string]: any;
}

/**
 * Creates a test launch using API instead of UI interactions
 * This is much faster and more reliable for test data creation
 * 
 * @param request - Playwright APIRequestContext (from page.request or context.request)
 * @param options - Options for creating the test launch
 * @param authToken - Authentication token from loginViaAPI (required for authentication)
 * @returns Promise<TestLaunchResponse> - The created launch data
 * 
 * @example
 * ```typescript
 * import { loginViaAPI } from '../helpers/api/login';
 * import { createTestLaunchViaAPI } from '../helpers/api/createTestLaunch';
 * 
 * test('create launch via API', async ({ request }) => {
 *   // First login via API to get authentication token
 *   const auth = await loginViaAPI(request);
 *   
 *   // Then use API to create launch with token
 *   const launch = await createTestLaunchViaAPI(request, {
 *     testGroupId: '86937250-21bd-411b-a524-e4c840d19939',
 *     aiModelId: '5.1', // or the actual model ID
 *   }, auth);
 *   
 *   console.log(`Launch created: ${launch.launchName}`);
 * });
 * ```
 */
export async function createTestLaunchViaAPI(
  request: APIRequestContext,
  options: CreateTestLaunchOptions,
  authToken: AuthToken
): Promise<TestLaunchResponse> {
  const {
    testGroupId,
    launchName,
    aiModelId = '5.1', // Default to 5.1 model
    environmentId,
    startTime = 'immediate',
    scheduledTime,
    projectId // Project ID for x-project-id header
  } = options;

  console.log('🚀 Creating test launch via API...');
  console.log(`   Test Group ID: ${testGroupId}`);
  console.log(`   AI Model ID: ${aiModelId}`);

  // First, we need to get the AI model ID from the model name
  // The API might need the actual model ID, not just the name
  let actualAiModelId = aiModelId;

  // If aiModelId is a name like "5.1 model", we need to fetch the actual model ID
  if (aiModelId.includes('model') || !aiModelId.match(/^[a-f0-9-]{36}$/i)) {
    console.log('   Fetching AI model list to get model ID...');
    try {
      const authHeaders = getAuthHeaders(authToken);
      if (projectId) {
        authHeaders['x-project-id'] = projectId;
      }
      const modelsResponse = await request.get('https://api.qa-path.com/api/aimodel/fetch-automation-models', {
        headers: authHeaders,
        ignoreHTTPSErrors: true,
      });
      if (modelsResponse.ok()) {
        const responseData = await modelsResponse.json();
        // API returns { success: true, data: [...], message: "..." }
        const models = responseData?.data || (Array.isArray(responseData) ? responseData : []);
        console.log(`   Found ${models.length} AI model(s)`);
        
        // Try to find the model by version (e.g., "5.1" -> "gpt-5.1") or name
        const model = Array.isArray(models) 
          ? models.find((m: any) => {
              const modelVersion = m.modelversion || m.modelVersion || '';
              const modelName = m.name || m.modelName || '';
              // Match by version (e.g., "gpt-5.1" contains "5.1") or name
              return modelVersion.toLowerCase().includes(aiModelId.toLowerCase().replace('model', '').trim()) ||
                     modelName.toLowerCase().includes(aiModelId.toLowerCase()) ||
                     m.id === aiModelId;
            })
          : null;
        
        if (model) {
          actualAiModelId = model.id; // Use the UUID id field
          console.log(`   ✅ Found model ID: ${actualAiModelId} (name: ${model.name}, version: ${model.modelversion || model.modelVersion})`);
        } else {
          console.log('   ⚠️ Model not found in list. Available models:');
          if (Array.isArray(models) && models.length > 0) {
            models.slice(0, 5).forEach((m: any) => {
              console.log(`      - ${m.name} (version: ${m.modelversion || m.modelVersion}, ID: ${m.id})`);
            });
          }
          throw new Error(`AI model "${aiModelId}" not found. Please provide a valid model UUID.`);
        }
      } else {
        const errorText = await modelsResponse.text();
        console.log(`   ⚠️ Failed to fetch models: ${modelsResponse.status()} - ${errorText}`);
        throw new Error(`Failed to fetch AI models: ${modelsResponse.status()}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Could not fetch model list: ${error}`);
      throw new Error(`Cannot create test launch without valid AI model ID. Error: ${error}`);
    }
  }

  // Prepare the request payload
  // Note: API expects 'testgroupId' (lowercase 'g'), not 'testGroupId'
  // The API expects: { testgroupId, name, isSequential, config: { llmModelId, environmentId }, hostname }
  const payload: any = {
    testgroupId: testGroupId, // API uses lowercase 'g'
    isSequential: true, // Default to true as per frontend
    config: {}, // Config object for llmModelId and environmentId
  };

  // Set launch name (API expects 'name', not 'launchName')
  if (launchName) {
    payload.name = launchName;
  }

  // Set AI model ID in config (API expects config.llmModelId, not aiModelId)
  if (actualAiModelId) {
    payload.config.llmModelId = actualAiModelId;
  }

  // Set environment ID in config (API expects config.environmentId, not environmentId)
  if (environmentId) {
    payload.config.environmentId = environmentId;
  }

  // Set hostname (required by API)
  // Use a default hostname if not provided
  payload.hostname = 'qa-path.com';

  console.log('   Request payload:', JSON.stringify(payload, null, 2));

  // Get authentication headers from token
  const headers = getAuthHeaders(authToken);
  
  // Add x-project-id header if provided (required for permission checks in database hooks)
  // The database hook checks if currentSetProjectId matches the test group's project_id
  if (projectId) {
    headers['x-project-id'] = projectId;
    console.log(`   Added x-project-id header: ${projectId}`);
  } else {
    // Try to fetch project ID from test group if not provided
    try {
      const testGroupResponse = await request.get(`https://api.qa-path.com/api/testgroups/${testGroupId}`, {
        headers,
        ignoreHTTPSErrors: true,
      });
      if (testGroupResponse.ok()) {
        const testGroupData = await testGroupResponse.json();
        const fetchedProjectId = testGroupData?.project_id || testGroupData?.projectId;
        if (fetchedProjectId) {
          headers['x-project-id'] = fetchedProjectId;
          console.log(`   Fetched and added x-project-id header: ${fetchedProjectId}`);
        }
      }
    } catch (error) {
      console.log('   ⚠️ Could not fetch test group to get project ID, continuing without x-project-id header');
    }
  }
  
  console.log('   Using authentication token for API request');

  const response = await request.post('https://api.qa-path.com/api/testcaseAutomation/createTestLaunch', {
    data: payload,
    headers,
    ignoreHTTPSErrors: true, // Ignore SSL certificate errors for QA environment
  });

  if (!response.ok()) {
    const errorText = await response.text();
    console.error('   ❌ Failed to create test launch');
    console.error(`   Status: ${response.status()}`);
    console.error(`   Error: ${errorText}`);
    throw new Error(`Failed to create test launch: ${response.status()} - ${errorText}`);
  }

  const launchData = await response.json();
  console.log('   ✅ Test launch created successfully');
  console.log(`   Launch ID: ${launchData.id || 'N/A'}`);
  console.log(`   Launch Name: ${launchData.launchName || launchName || 'N/A'}`);

  return launchData as TestLaunchResponse;
}

/**
 * Helper function to get AI model ID from model name
 * This can be used to resolve model names to IDs before creating a launch
 * 
 * @param request - Playwright APIRequestContext
 * @param modelName - Model name to search for (e.g., "5.1 model")
 * @param authToken - Authentication token from loginViaAPI
 * @returns Promise<string | null> - Model ID or null if not found
 */
export async function getAiModelId(
  request: APIRequestContext,
  modelName: string,
  authToken: AuthToken
): Promise<string | null> {
    try {
      const headers = getAuthHeaders(authToken);
      const response = await request.get('https://api.qa-path.com/api/aimodel/fetch-automation-models', {
        headers,
        ignoreHTTPSErrors: true, // Ignore SSL certificate errors for QA environment
      });
      if (response.ok()) {
      const models = await response.json();
      const model = Array.isArray(models)
        ? models.find((m: any) => 
            m.name?.toLowerCase().includes(modelName.toLowerCase()) ||
            m.id === modelName
          )
        : null;
      
      return model ? (model.id || model.modelId || null) : null;
    }
  } catch (error) {
    console.error('Error fetching AI models:', error);
  }
  return null;
}

