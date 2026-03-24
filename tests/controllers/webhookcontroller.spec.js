import { test, expect } from '@playwright/test';

test.describe('Garmin Webhook Controller', () => {
    test('POST /webhook/garmin-body-composition should return 200 for valid data structure', async ({ request }) => {
        // The code processes compositionData.map, even if async, it returns 200 early if structure matches
        const response = await request.post('/webhook/garmin-body-composition', {
            data: {
                bodyComps: []
            }
        });
        expect(response.status()).toBe(200);
        expect(await response.text()).toBe('Data processed successfully');
    });

    test('POST /webhook/garmin-body-composition should return 500 if bodyComps is missing', async ({ request }) => {
        const response = await request.post('/webhook/garmin-body-composition', {
            data: {}
        });
        expect(response.status()).toBe(500);
    });
});