import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGetStripeCustomer, handleGetStripePortal, stripe } from '../../controllers/stripecontroller.js';
import { logError } from '../../error/log.js';

vi.mock('../../error/log.js');

describe('Stripe Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {}
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            end: vi.fn().mockReturnThis()
        };
        vi.clearAllMocks();
    });

    describe('handleGetStripeCustomer', () => {
        it('should return 400 if session id is missing', async () => {
            await handleGetStripeCustomer(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.end).toHaveBeenCalled();
        });

        it('should return mock customer for test session id', async () => {
            req.query.session = '987654321';
            await handleGetStripeCustomer(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ customer: 'cus_1234567890' });
        });

        it('should retrieve customer from stripe session', async () => {
            req.query.session = 'sess_123';
            vi.spyOn(stripe.checkout.sessions, 'retrieve').mockResolvedValue({ customer: 'cus_abc' });

            await handleGetStripeCustomer(req, res);

            expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith('sess_123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ customer: 'cus_abc' });
        });

        it('should return 404 if stripe retrieval fails', async () => {
            req.query.session = 'sess_fail';
            vi.spyOn(stripe.checkout.sessions, 'retrieve').mockRejectedValue(new Error('Stripe error'));

            await handleGetStripeCustomer(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.end).toHaveBeenCalled();
        });
    });

    describe('handleGetStripePortal', () => {
        it('should return 200 and portal url', async () => {
            req.query.customer = 'cus_123';
            vi.spyOn(stripe.billingPortal.sessions, 'create').mockResolvedValue({ url: 'https://portal.url' });

            await handleGetStripePortal(req, res);

            expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
                customer: 'cus_123',
                return_url: 'https://nutricoachme.com'
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ url: 'https://portal.url' });
        });

        it('should return 400 if customer id is missing', async () => {
            await handleGetStripePortal(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.end).toHaveBeenCalled();
        });
    });
});