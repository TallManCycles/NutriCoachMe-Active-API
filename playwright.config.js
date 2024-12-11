import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 10000,
    use: {
        baseURL: 'http://localhost:3000/',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
});