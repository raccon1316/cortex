import { defineConfig } from "@playwright/test";

/**
 * Browser E2E (Part F). Uses the locally installed Google Chrome
 * (channel: "chrome") so no Playwright browser download is needed.
 * Tests run against `npm run dev` on localhost:3000 (started separately).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
});
