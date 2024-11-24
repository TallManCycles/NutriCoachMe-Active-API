
import { scheduleTask } from '../service/cronService.js';
import { checkinTask } from './checkinTask.js';

const times = {
    every30Seconds: '*!/30 * * * * *',
    every5Seconds: '*!/5 * * * * *',
    everyDayAtMidnight: '0 0 * * *',
    everyDayAt8AM: '0 8 * * *',
    every5Minutes: '*!/5 * * * *',
    everySundayAt12pm: '0 12 * * 0',
}

/*const exampleTask = () => {
    console.log('Task executed at', new Date().toLocaleString());
};*/

scheduleTask(times.everySundayAt12pm,checkinTask);
