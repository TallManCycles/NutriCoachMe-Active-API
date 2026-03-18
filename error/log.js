import fs from 'fs';

function logError(error) {
    try {
        console.error(error);

        if (process.env.NODE_ENV === 'development') {
            return;
        }

        const timestamp = new Date().toISOString();
        const errorMessage = `${timestamp} - ${error.stack || error.message || error}\n`;

        fs.appendFile('error_log.txt', errorMessage, (err) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        });        
    } catch (err) {
        console.error('Failed to log error:', err);
    }
}

function logInfo(customInfo) {
    try {
        console.log(customInfo);

        if (process.env.NODE_ENV === 'development') {
            return;
        }

        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${customInfo}\n`;

        fs.appendFile('error_log.txt', logMessage, (err) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        });        
    } catch (err) {
        console.error('Failed to log info:', err);
    }    
}

export { logError, logInfo};