import { test, expect } from '@playwright/test';

test('Health Check API', async ({ request }) => {
    const response = await request.get('/api/health-check');
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.message).toContain('Server is healthy!');
});