import { test, expect } from '@playwright/test';

test.describe('OAuth Controller API Endpoints', () => {
    test('GET /api/start-google-oauth should return a URL', async ({ request }) => {
        const response = await request.get('/api/start-google-oauth?userId=123');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.url).toContain('accounts.google.com');
    });

    test('GET /api/request-garmin-token should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.get('/api/request-garmin-token');
        expect(response.status()).toBe(401);
    });

    test('GET /api/googleoauth should return 500 if code is missing or invalid', async ({ request }) => {
        const response = await request.get('/api/googleoauth');
        // The tokens exchange will fail without a code
        expect(response.status()).toBe(500);
    });
});