import { test, expect } from '@playwright/test';

test.describe('OpenAI Controller API Endpoints', () => {
    test('POST /api/food-assist should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.post('/api/food-assist', {
            data: {
                calories: 500,
                protein: 30,
                carbs: 50,
                fats: 20,
                now: new Date().toISOString()
            }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /api/food-input should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.post('/api/food-input', {
            data: { prompt: '1 large apple' }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /api/food-nutrition should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.post('/api/food-nutrition', {
            data: {}
        });
        expect(response.status()).toBe(401);
    });

    test('POST /api/create-self-checkin should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.post('/api/create-self-checkin', {
            data: {
                formdata: { email: 'test@test.com' },
                template: 'test',
                subject: 'test'
            }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /api/coach-check-in should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.post('/api/coach-check-in', {
            data: { template: 'test' }
        });
        expect(response.status()).toBe(401);
    });
});