import { test, expect } from '@playwright/test';

test.describe('Weight Tracker Controller', () => {
    test('POST /api/weight-tracker should return 400 if ping is not 1', async ({ request }) => {
        const response = await request.post('/api/weight-tracker', {
            data: { ping: 0 }
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.error).toBe('Invalid request');
    });

    test('POST /api/weight-tracker should return 400 if ping is missing', async ({ request }) => {
        const response = await request.post('/api/weight-tracker', {
            data: {}
        });
        expect(response.status()).toBe(400);
    });
});