import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Perform any global cleanup here
  console.log('Global teardown: Cleaning up test environment...');
  
  // Example: Clean up test data, close connections, etc.
  
  console.log('Global teardown: Complete');
}

export default globalTeardown;