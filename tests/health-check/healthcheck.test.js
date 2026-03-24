import { describe, it, expect, vi } from 'vitest';
import { getHealthCheck, getRoot } from '../../controllers/healthcheckcontroller.js';

describe('Health Check Unit Tests', () => {
    it('getRoot should send "Server is running!"', () => {
        const req = {};
        const res = {
            send: vi.fn(),
        };

        getRoot(req, res);
        expect(res.send).toHaveBeenCalledWith('Server is running!');
    });

    it('getHealthCheck should return 200 with a healthy message', () => {
        const req = {};
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        getHealthCheck(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('Server is healthy!'),
            })
        );
    });
});
