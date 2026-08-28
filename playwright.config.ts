import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
      // Mobile-only specs run in the mobile project, not here.
      testIgnore: /.*\.mobile\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `bun run build && bunx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
