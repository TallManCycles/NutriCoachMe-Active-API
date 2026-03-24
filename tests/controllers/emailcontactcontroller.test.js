import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleContactForm } from '../../controllers/emailcontactcontroller.js';
import { sendEmail } from '../../service/emailService.js';
import { logError } from '../../error/log.js';

vi.mock('../../service/emailService.js');
vi.mock('../../error/log.js');

describe('Email Contact Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        vi.clearAllMocks();
    });

    describe('handleContactForm', () => {
        it('should send contact email and return 200 on success', async () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                message: 'Hello World'
            };
            sendEmail.mockResolvedValue({ ok: true });

            await handleContactForm(req, res);

            expect(sendEmail).toHaveBeenCalledWith(
                'support@nutricoachme.com',
                'test@example.com',
                'Contact Form Submission',
                expect.stringContaining('Test User has submitted a contact form.'),
                'test@example.com'
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Success" });
        });

        it('should return 500 if sendEmail fails', async () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                message: 'Hello World'
            };
            sendEmail.mockResolvedValue({ ok: false });

            await handleContactForm(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Failed" });
        });
    });
});