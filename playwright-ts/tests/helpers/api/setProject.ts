import { APIRequestContext } from '@playwright/test';
import { AuthToken, getAuthHeaders } from './login';

/**
 * Interface for setProject API response
 */
export interface SetProjectResponse {
  status: string;
  code: string;
  message: string;
  project: {
    id: string;
    name: string;
    key: string;
    [key: string]: any;
  };
}

/**
 * Sets the current project for the user via API
 * This must be called after login and before accessing project-specific resources
 * 
 * @param request - Playwright APIRequestContext (should be the same context used for login)
 * @param projectId - The UUID of the project to set as current
 * @param authToken - Authentication token from loginViaAPI
 * @param baseUrl - Base API URL (default: https://api.qa-path.com)
 * @returns Promise<SetProjectResponse> - The project data from the API response
 * 
 * @example
 * ```typescript
 * import { loginViaAPI } from '../helpers/api/login';
 * import { setProjectViaAPI } from '../helpers/api/setProject';
 * 
 * test('set project via API', async ({ request }) => {
 *   // 1. Login first
 *   const { authToken, requestContext } = await loginViaAPI(request);
 *   
 *   // 2. Set the project
 *   const project = await setProjectViaAPI(requestContext, 'project-id', authToken);
 *   console.log(`Project set: ${project.project.name}`);
 * });
 * ```
 */
export async function setProjectViaAPI(
  request: APIRequestContext,
  projectId: string,
  authToken: AuthToken,
  baseUrl: string = 'https://api.qa-path.com'
): Promise<SetProjectResponse> {
  console.log('📁 Setting current project via API...');
  console.log(`   Project ID: ${projectId}`);

  const payload = {
    projectId,
  };

  const headers = getAuthHeaders(authToken);

  const response = await request.post(`${baseUrl}/api/user/setProject`, {
    data: payload,
    headers,
    ignoreHTTPSErrors: true, // Ignore SSL certificate errors for QA environment
  });

  if (!response.ok()) {
    const errorText = await response.text();
    console.error('   ❌ Failed to set project');
    console.error(`   Status: ${response.status()}`);
    console.error(`   Error: ${errorText}`);
    throw new Error(`Failed to set project: ${response.status()} - ${errorText}`);
  }

  const projectData = await response.json() as SetProjectResponse;
  console.log('   ✅ Project set successfully');
  console.log(`   Project Name: ${projectData.project.name}`);
  console.log(`   Project Key: ${projectData.project.key}`);

  return projectData;
}

