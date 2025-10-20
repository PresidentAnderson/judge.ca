import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Perform any global setup here
  console.log('Global setup: Preparing test environment...');
  
  // Example: Login once and save auth state
  if (process.env.E2E_AUTH_REQUIRED === 'true') {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Perform authentication
    await page.goto(config.projects[0].use.baseURL + '/login');
    // Add login steps here if needed
    
    // Save storage state
    await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });
    await browser.close();
  }
  
  console.log('Global setup: Complete');
}

export default globalSetup;