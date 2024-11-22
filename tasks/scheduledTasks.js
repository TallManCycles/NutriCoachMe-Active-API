
import { scheduleTask } from '../service/cronService.js';

const exampleTask = () => {
    console.log('Task executed at', new Date().toLocaleString());
};

scheduleTask('0 8 * * *', exampleTask);
