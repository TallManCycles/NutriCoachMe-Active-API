
import { scheduleTask } from '../service/cronService.js';
import { checkinTask } from './checkinTask.js';

const times = {
    every30Seconds: '30 * * * * *',
    every5Seconds: '5 * * * * *',
    everyDayAtMidnight: '0 0 0 * *',
    everyDayAt8AM: '* 0 8 * * *',
    every5Minutes: '0 5 * * * *',
    everySundayAt5pm: '0 0 17 * * 7',
}

scheduleTask(times.everySundayAt5pm, checkinTask);
