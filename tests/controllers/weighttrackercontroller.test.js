import { describe, it, expect, vi } from 'vitest';
import { handleWeightTracker } from '../../controllers/weighttrackercontroller.js';

// Mock supabase
vi.mock('../../data/supabase.js', () => ({
    default: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
    }
}));

// Mock logError
vi.mock('../../error/log.js', () => ({
    logError: vi.fn(),
}));

describe('Weight Tracker Controller Unit Tests', () => {
    it('handleWeightTracker should return 400 if ping is not 1', async () => {
        const req = { body: { ping: 0 } };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        await handleWeightTracker(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
    });

    it('handleWeightTracker should return 400 if ping is missing', async () => {
        const req = { body: {} };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        await handleWeightTracker(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
