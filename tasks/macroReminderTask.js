import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import process from 'process';
import supabase from '../data/supabase.js';
import { sendEmail } from '../service/emailService.js';
import { logInfo, logError } from '../error/log.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '../templates/macro-reminder-template.html');
const htmlContent = fs.readFileSync(templatePath, 'utf8');

async function macroReminderTask() {
    logInfo(`begin macro reminder task at ${new Date().toLocaleString()}`);

    try {
        // The cron is in 'Australia/Brisbane', so we should get the date for that timezone.
        const now = new Date();
        const brisbaneTime = new Date(now.getTime() + (10 * 60 * 60 * 1000)); // UTC+10
        const today = brisbaneTime.toISOString().split('T')[0];

        // 1. Get all active users with email notifications enabled.
        const { data: activeUsers, error: usersError } = await supabase
            .from('users')
            .select('uuid, email')
            .eq('checkin_reminders', true)
            .gte('active_until', new Date().toISOString());

        if (usersError) {
            logError(new Error(`Error fetching active users: ${usersError.stack}`));
            return;
        }

        if (!activeUsers || activeUsers.length === 0) {
            logInfo('No active users with email notifications enabled');
            return;
        }

        // 2. Get all user UUIDs that have logged macros today from the active users list.
        const { data: loggedUsers, error: loggedError } = await supabase
            .from('usermetrics')
            .select('uuid')
            .eq('date', today)
            .in('uuid', activeUsers.map(u => u.uuid));

        if (loggedError) {
            logError(new Error(`Error fetching nutrition details: ${loggedError.stack}`));
            return;
        }

        const loggedUserUuids = new Set(loggedUsers.map(u => u.uuid));
        const usersToRemind = activeUsers.filter(u => !loggedUserUuids.has(u.uuid));

        logInfo(`Found ${usersToRemind.length} users to remind.`);

        for (const user of usersToRemind) {
            logInfo(`No macros logged for ${user.email} on ${today}. Sending reminder.`);

            logInfo(`Sending reminder email to ${user.email}...`);
            try {
                const response = await sendEmail(
                    user.email,
                    'support@nutricoachme.com',
                    'Daily Macro Logging Reminder',
                    htmlContent,
                    'aaron@nutricoachme.com'
                );

                if (response && response.ok) {
                    logInfo(`Email sent successfully to ${user.email}`);
                } else {
                    logError(new Error(`Failed to send email to ${user.email}. Response: ${JSON.stringify(response)}`));
                }
            } catch (emailError) {
                logError(new Error(`Failed to send email to ${user.email}: ${emailError.stack}`));
            }
        }
    } catch (error) {
        logError(new Error(`Unhandled error in macroReminderTask: ${error.stack}`));
    }
}

export { macroReminderTask };