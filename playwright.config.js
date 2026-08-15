import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Sleeper Draft Assistant
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: 'Laptop Widescreen',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      }
    },
    {
      name: 'Mobile Viewport',
      use: {
        ...devices['Pixel 5']
      }
    }
  ],
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120 * 1000
  }
});
