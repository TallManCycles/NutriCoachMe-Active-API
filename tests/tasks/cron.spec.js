import { test, expect } from '@playwright/test';
import cron from 'node-cron';
import { times } from '../../tasks/scheduledTasks.js';

test.describe('Cron Schedule Validation', () => {
    test('everySundayAt5pm should be a valid cron string', () => {
        const isValid = cron.validate(times.everySundayAt5pm);
        expect(isValid).toBe(true);
    });

    test('everyHour should be a valid cron string', () => {
        const isValid = cron.validate(times.everyHour);
        expect(isValid).toBe(true);
    });

    test('Verify the Sunday 5pm cron string specifically', () => {
        // '0 0 17 * * 0' -> 0 seconds, 0 minutes, 17 hours (5pm), any day of month, any month, Sunday (0)
        // Note: some cron implementations use 0-6 for Sun-Sat, others 1-7. node-cron uses 0-6 or names.
        expect(times.everySundayAt5pm).toBe('0 0 17 * * 0');
        const isValid = cron.validate(times.everySundayAt5pm);
        expect(isValid).toBe(true);
    });

    test('Checkin reminder task should be scheduled for Sunday at 5pm Brisbane time', () => {
        // This is a documentation/assertion test to clarify the intention
        expect(times.everySundayAt5pm).toBe('0 0 17 * * 0');
    });
});
