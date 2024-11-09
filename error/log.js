import fs from 'fs';

function logError(error) {
    try {
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
    } catch (err) {
        console.error('Failed to log error:', err);
    }
}

function logInfo(customInfo) {
    try {
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
    } catch (err) {
        console.error('Failed to log info:', err);
    }    
}

export { logError, logInfo};