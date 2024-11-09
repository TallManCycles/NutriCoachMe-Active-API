import fs from 'fs';

function logError(error) {
    
    if (process.env.NODE_ENV === 'development') {
        console.error(error);
        return;
    }
    
    const timestamp = new Date().toISOString();
    const errorMessage = `${timestamp} - ${error.message}\n`;

    fs.appendFile('error_log.txt', errorMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

function logInfo(customInfo) {

    if (process.env.NODE_ENV === 'development') {
        console.log(customInfo);
        return;
    }
    
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${customInfo}\n`;

    fs.appendFile('error_log.txt', logMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

export { logError, logInfo};