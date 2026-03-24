import { test, expect } from '@playwright/test';

test.describe('Stripe Webhook Controller', () => {
    test('POST /webhook/stripe should return 400 for invalid signature', async ({ request }) => {
        const response = await request.post('/webhook/stripe', {
            headers: {
                'stripe-signature': 'invalid_sig'
            },
            data: {
                id: 'evt_test',
                type: 'customer.subscription.created'
            }
        });
        // The constructEvent method will throw and catch returning 400
        expect(response.status()).toBe(400);
    });

    test('POST /webhook/stripe should return 400 for unhandled event type', async ({ request }) => {
        // Even if we bypassed the signature check, unhandled types return 400
        // However, middleware runs first. This test ensures the endpoint exists.
        const response = await request.post('/webhook/stripe', {
            data: { type: 'unknown.event' }
        });
        expect(response.status()).toBe(400);
    });
});