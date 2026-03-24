import { describe, it, expect, vi } from 'vitest';
import { handleGarminWebhook } from '../../controllers/webhookcontroller.js';

// Mock supabase to avoid real DB calls
vi.mock('../../data/supabase.js', () => ({
    default: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
    }
}));

describe('Garmin Webhook Controller Unit Tests', () => {
    it('handleGarminWebhook should return 200 for valid data structure', async () => {
        const req = {
            body: {
                bodyComps: []
            }
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };

        await handleGarminWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith('Data processed successfully');
    });

    it('handleGarminWebhook should return 500 if bodyComps is missing', async () => {
        const req = {
            body: {}
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };

        await handleGarminWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Internal Server Error');
    });
});
