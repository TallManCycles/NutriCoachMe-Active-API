import { test, expect } from '@playwright/test';

test.describe('Stripe Controller API Endpoints', () => {
    test('GET /api/stripe/customer should return 400 for missing session query', async ({ request }) => {
        const response = await request.get('/api/stripe/customer');
        expect(response.status()).toBe(400);
    });

    test('GET /api/stripe/customer should return 200 for mock session ID 987654321', async ({ request }) => {
        const response = await request.get('/api/stripe/customer?session=987654321');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.customer).toBe('cus_1234567890');
    });

    test('GET /api/stripe/portal should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.get('/api/stripe/portal?customer=cus_123');
        expect(response.status()).toBe(401);
    });
});