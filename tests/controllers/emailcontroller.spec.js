import { test, expect } from '@playwright/test';

test.describe('Email Controller API Endpoints', () => {
    
    test('POST /api/send-email should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.post('/api/send-email', {
            data: {
                subject: 'Test',
                template: '<h1>Hello</h1>',
                formdata: { email: 'client@example.com' }
            }
        });
        
        expect(response.status()).toBe(401);
    });

    test('POST /api/send-email-user should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.post('/api/send-email-user', {
            data: {
                html: '<p>Test</p>',
                subject: 'Sub',
                to: 'user@example.com',
                from: 'support@example.com'
            }
        });
        
        expect(response.status()).toBe(401);
    });

    test('POST /api/send-email-notification should return 401 Unauthorized without token', async ({ request }) => {
        const response = await request.post('/api/send-email-notification', {
            data: {
                html: '<p>Test</p>',
                subject: 'Notification',
                to: 'admin@example.com',
                from: 'system@example.com'
            }
        });
        
        expect(response.status()).toBe(401);
    });

    test('POST /api/contact-form should work without authentication (public route)', async ({ request }) => {
        // This test hits the public contact form endpoint.
        // We use the test provider config via the server's environment if possible,
        // or expect the server to handle the logic.
        const response = await request.post('/api/contact-form', {
            data: {
                name: 'Test User',
                email: 'test@example.com',
                message: 'Hello World'
            }
        });

        // Can be 200 (Success) or 500 (Provider fail) but should NOT be 401
        expect(response.status()).not.toBe(401);
    });

    test('POST /api/contact-form should be rate limited', async ({ request }) => {
        // The rate limit is 1 request per 30 seconds for this endpoint
        // First request
        await request.post('/api/contact-form', {
            data: { name: '1', email: '1@a.com', message: 'm' }
        });
        
        // Immediate second request
        const response = await request.post('/api/contact-form', {
            data: { name: '2', email: '2@a.com', message: 'm' }
        });

        expect(response.status()).toBe(429);
    });
});