// @ts-check
const { defineConfig } = require('@playwright/test');

const PORT = 4173;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // Tests tagged @external hit third-party sites: run them with `npm run test:links`.
  grepInvert: process.env.EXTERNAL ? undefined : /@external/,
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    // The locally installed Google Chrome (also preinstalled on GitHub runners).
    channel: 'chrome',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
