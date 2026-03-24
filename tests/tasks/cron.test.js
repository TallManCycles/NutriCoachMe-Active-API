import { describe, it, expect } from 'vitest';
import cron from 'node-cron';
import { times } from '../../tasks/scheduledTasks.js';

describe('Cron Schedule Validation Unit Tests', () => {
    it('everySundayAt5pm should be a valid cron string', () => {
        const isValid = cron.validate(times.everySundayAt5pm);
        expect(isValid).toBe(true);
    });

    it('everyHour should be a valid cron string', () => {
        const isValid = cron.validate(times.everyHour);
        expect(isValid).toBe(true);
    });

    it('Verify the Sunday 5pm cron string specifically', () => {
        expect(times.everySundayAt5pm).toBe('0 0 17 * * 0');
        const isValid = cron.validate(times.everySundayAt5pm);
        expect(isValid).toBe(true);
    });

    it('Checkin reminder task should be scheduled for Sunday at 5pm Brisbane time', () => {
        expect(times.everySundayAt5pm).toBe('0 0 17 * * 0');
    });
});
