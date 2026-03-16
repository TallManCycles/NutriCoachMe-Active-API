import { scheduleTask } from '../service/cronService.js';
import { checkinTask } from './checkinTask.js';
import { macroReminderTask } from './macroReminderTask.js';
import {getBiometricsFromGoogle} from '../data/google.js';

export const times = {
    every30Seconds: '30 * * * * *',
    every5Seconds: '5 * * * * *',
    everyDayAtMidnight: '0 0 0 * * *',
    everyDayAt8AM: '0 0 8 * * *',
    every5Minutes: '0 */5 * * * *',
    everySundayAt5pm: '0 0 17 * * 0',
    everyDayAt5pm: '0 0 17 * * *',
    everyHour: '0 0 * * * *',
}

console.log('Scheduling checkin task for every Sunday at 5pm');
scheduleTask(times.everySundayAt5pm, async () => {
    try {
        console.log('Starting checkin task at:', new Date().toISOString());
        await checkinTask();
        console.log('Completed checkin task at:', new Date().toISOString());
    } catch (error) {
        console.error('Error in checkin task:', error);
    }
});

console.log('Scheduling macro reminder task for every day at 5pm');
scheduleTask(times.everyDayAt5pm, async () => {
    try {
        console.log('Starting macro reminder task at:', new Date().toISOString());
        await macroReminderTask();
        console.log('Completed macro reminder task at:', new Date().toISOString());
    } catch (error) {
        console.error('Error in macro reminder task:', error);
    }
});

scheduleTask(times.everyHour, async () => {
    try {
        await getBiometricsFromGoogle();
    } catch (error) {
        console.error('Error in biometrics task:', error);
    }
});
