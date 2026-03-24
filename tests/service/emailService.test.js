import { describe, it, expect, afterEach, vi } from 'vitest';
import { sendEmail } from '../../service/emailService.js';

describe('Email Service Provider Logic Unit Tests', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('should use test provider when EMAIL_PROVIDER is set to "test"', async () => {
        process.env.EMAIL_PROVIDER = 'test';
        const result = await sendEmail(
            'recipient@example.com', 
            'sender@example.com', 
            'Test Subject', 
            '<p>Test</p>'
        );
        
        expect(result.ok).toBe(true);
        expect(result.message).toBe('Simulated success (test provider)');
    });

    it('should prefer mailgun when MAILGUN_API_KEY is present and no provider is explicitly set', async () => {
        process.env.MAILGUN_API_KEY = 'mock-mg-key';
        process.env.MAILGUN_DOMAIN = 'mg.example.com';
        delete process.env.EMAIL_PROVIDER;
        
        const result = await sendEmail(
            'to@example.com', 
            'from@example.com', 
            'Sub', 
            'Body'
        );
        
        expect(result.message).not.toContain('No email provider configured');
    });

    it('should fallback to sendgrid when no provider set and only API_KEY is present', async () => {
        delete process.env.MAILGUN_API_KEY;
        process.env.API_KEY = 'mock-sg-key';
        delete process.env.EMAIL_PROVIDER;

        const result = await sendEmail(
            'to@example.com', 
            'from@example.com', 
            'Sub', 
            'Body'
        );
        
        expect(result.message).not.toContain('No email provider configured');
    });

    it('should return 500 error when no providers are configured', async () => {
        delete process.env.MAILGUN_API_KEY;
        delete process.env.API_KEY;
        delete process.env.EMAIL_PROVIDER;

        const result = await sendEmail(
            'to@example.com', 
            'from@example.com', 
            'Sub', 
            'Body'
        );

        expect(result.ok).toBe(false);
        expect(result.status).toBe(500);
        expect(result.message).toContain('No email provider configured');
    });
});
