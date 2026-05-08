import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PORT || '3000'
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: 'pnpm start',
        url: BASE_URL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})
