
import { scheduleTask } from '../service/cronService.js';
import { checkinTask } from './checkinTask.js';
import process from "process";

const times = {
    every30Seconds: '*!/30 * * * * *',
    every5Seconds: '*!/5 * * * * *',
    everyDayAtMidnight: '0 0 * * *',
    everyDayAt8AM: '0 8 * * *',
    every5Minutes: '*!/5 * * * *',
    everySundayAt9am: '0 9 * * 0',
}

/*const exampleTask = () => {
    console.log('Task executed at', new Date().toLocaleString());
};*/

if (process.env.NODE_ENV === 'development') {
    console.log('Scheduled task disabled in development');
} else {    
    scheduleTask(times.everySundayAt9am, await checkinTask);
}
