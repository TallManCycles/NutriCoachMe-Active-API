import cron from 'node-cron';

/**
 * Schedules a function to run at specified intervals.
 * @param {string} schedule - The cron schedule string.
 * @param {Function} task - The function to execute.
 */
export const scheduleTask = (schedule, task) => {
    
    const valid = cron.validate(schedule);
    
    if (!valid) {
        console.error('Invalid cron schedule:', schedule);
        return;
    }
    
    console.log('Task scheduled to run at', schedule, 'UTC', new Date().toISOString());
    if (process.env.NODE_ENV === 'development') {
        console.log('Task will run NOT in development mode');
    } else {
        cron.schedule(schedule, task, {
            scheduled: true,
            timezone: 'Australia/Brisbane',
        });
    }
};