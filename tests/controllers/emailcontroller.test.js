import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSendEmail, handleSendEmailUser, handleSendEmailNotification } from '../../controllers/emailcontroller.js';
import { sendEmail } from '../../service/emailService.js';
import { logError } from '../../error/log.js';

vi.mock('../../service/emailService.js');
vi.mock('../../error/log.js');

describe('Email Controller', () => {
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

    describe('handleSendEmail', () => {
        it('should send email and return 200 on success', async () => {
            req.body = {
                formdata: { email: 'client@example.com' },
                template: '<h1>Hello</h1>',
                subject: 'Test Subject'
            };
            sendEmail.mockResolvedValue({ ok: true });

            await handleSendEmail(req, res);

            expect(sendEmail).toHaveBeenCalledWith(
                "fatforweightloss@gmail.com",
                "aaron@nutricoachme.com",
                'Test Subject',
                '<h1>Hello</h1>',
                'client@example.com'
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Success" });
        });

        it('should return 500 if sendEmail fails', async () => {
            req.body = {
                formdata: { email: 'client@example.com' },
                template: '<h1>Hello</h1>',
                subject: 'Test Subject'
            };
            sendEmail.mockResolvedValue({ ok: false });

            await handleSendEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Failed" });
        });

        it('should return 500 and log error on exception', async () => {
            req.body = {
                formdata: { email: 'client@example.com' },
                template: '<h1>Hello</h1>',
                subject: 'Test Subject'
            };
            const error = new Error('Test error');
            sendEmail.mockRejectedValue(error);

            await handleSendEmail(req, res);

            expect(logError).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "An unknown error has occurred." });
        });
    });

    describe('handleSendEmailUser', () => {
        it('should send email to user and return 200 on success', async () => {
            req.body = {
                html: '<p>Test</p>',
                subject: 'Sub',
                to: 'user@example.com',
                from: 'support@example.com',
                replyTo: 'reply@example.com'
            };
            sendEmail.mockResolvedValue({ ok: true });

            await handleSendEmailUser(req, res);

            expect(sendEmail).toHaveBeenCalledWith(
                'user@example.com',
                'support@example.com',
                'Sub',
                '<p>Test</p>',
                'reply@example.com'
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('handleSendEmailNotification', () => {
        it('should send email notification and return 200 on success', async () => {
            req.body = {
                html: '<p>Notification</p>',
                subject: 'Note',
                to: 'admin@example.com',
                from: 'system@example.com'
            };
            sendEmail.mockResolvedValue({ ok: true });

            await handleSendEmailNotification(req, res);

            expect(sendEmail).toHaveBeenCalledWith(
                'admin@example.com',
                'system@example.com',
                'Note',
                '<p>Notification</p>',
                'system@example.com'
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});