import cron from 'node-cron';

/**
 * Schedules a function to run at specified intervals.
 * @param {string} schedule - The cron schedule string.
 * @param {Function} task - The function to execute.
 */
export const scheduleTask = (schedule, task) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('Task scheduled to run at', schedule);
    } else {
        cron.schedule(schedule, task);
    }
};