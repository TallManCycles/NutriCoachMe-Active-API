import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFoodAssist, handleFoodInput, handleFoodNutrition, handleCreateSelfCheckin, handleCoachCheckIn, openai, sgMail } from '../../controllers/openaicontroller.js';
import { logError } from '../../error/log.js';

vi.mock('../../error/log.js');
vi.mock('@sendgrid/mail');

describe('OpenAI Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            protocol: 'http',
            get: vi.fn().mockReturnValue('localhost'),
            file: { filename: 'test.jpg' }
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        vi.clearAllMocks();
    });

    describe('handleFoodAssist', () => {
        it('should return AI response for food assist', async () => {
            req.body = { calories: 2000, protein: 150, carbs: 200, fats: 70, now: '2023-10-27T10:00:00Z' };
            vi.spyOn(openai.chat.completions, 'create').mockResolvedValue({
                choices: [{ message: { content: 'Try some chicken.' } }]
            });

            await handleFoodAssist(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Try some chicken.' });
        });
    });

    describe('handleFoodInput', () => {
        it('should return nutrition info for food input', async () => {
            req.body = { prompt: '1 apple' };
            vi.spyOn(openai.chat.completions, 'create').mockResolvedValue({
                choices: [{ message: { content: '[{"food":"apple","calories":95}]' } }]
            });

            await handleFoodInput(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: '[{"food":"apple","calories":95}]' });
        });
    });

    describe('handleFoodNutrition', () => {
        it('should return analysis for nutritional label image', async () => {
            vi.spyOn(openai.chat.completions, 'create').mockResolvedValue({
                choices: [{ message: { content: '{"calories": 100}' } }]
            });

            await handleFoodNutrition(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ analysis: '{"calories": 100}' });
        });
    });

    describe('handleCreateSelfCheckin', () => {
        it('should create thread, run assistant and send email', async () => {
            req.body = { formdata: { email: 'test@test.com' }, template: 'T', subject: 'S' };
            
            vi.spyOn(openai.beta.threads, 'create').mockResolvedValue({ id: 't1' });
            vi.spyOn(openai.beta.threads.messages, 'create').mockResolvedValue({});
            vi.spyOn(openai.beta.threads.runs, 'create').mockResolvedValue({ id: 'r1' });
            vi.spyOn(openai.beta.threads.runs, 'retrieve').mockResolvedValue({ status: 'completed' });
            vi.spyOn(openai.beta.threads.messages, 'list').mockResolvedValue({
                data: [{ content: [{ text: { value: 'AI response' } }] }]
            });
            vi.spyOn(sgMail, 'send').mockResolvedValue([{ statusCode: 202 }]);

            await handleCreateSelfCheckin(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Success" });
        });
    });

    describe('handleCoachCheckIn', () => {
        it('should return AI response for coach check-in', async () => {
            req.body = { template: 'Check-in details' };
            vi.spyOn(openai.chat.completions, 'create').mockResolvedValue({
                choices: [{ message: { content: 'Coach feedback.' } }]
            });

            await handleCoachCheckIn(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Coach feedback.' });
        });
    });
});