import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import process from 'process';
import supabase from '../data/supabase.js';
import { sendEmail } from '../data/sendgrid.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '../templates/macro-reminder-template.html');
const htmlContent = fs.readFileSync(templatePath, 'utf8');

async function macroReminderTask() {

    console.log('begin macro reminder task at', new Date().toLocaleString());

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Only send to active users with email notifications enabled
    const {data: activeUsers} = await supabase
        .from('users')
        .select()
        .eq('email_notifications', true)
        .gte('active_until', new Date().toISOString());

    if (!activeUsers || activeUsers.length === 0) {
        console.log('No active users with email notifications enabled');
        return;
    }

    for (const user of activeUsers) {
        console.log(`Checking macros for ${user.email} on ${today}`);

        // Check if the user has logged any macros for today
        const {data: macros, error} = await supabase
            .from('nutritiondetails')
            .select('id')
            .eq('uuid', user.uuid)
            .eq('datestart', today);

        if (error) {
            console.error(`Error fetching macros for ${user.email}:`, error);
            continue;
        }

        if (!macros || macros.length === 0) {
            console.log(`No macros logged for ${user.email} on ${today}. Sending reminder.`);

            if (process.env.NODE_ENV === 'production') {
                console.log(`Sending real reminder email to ${user.email}...`);
                const response = await sendEmail(
                    user.email,
                    'support@nutricoachme.com',
                    'Daily Macro Logging Reminder',
                    htmlContent,
                    'aaron@nutricoachme.com'
                );

                if (response && response[0] && response[0].statusCode === 202) {
                    console.log('Email sent successfully to', user.email);
                } else {
                    console.error('Failed to send email to', user.email, 'Response:', JSON.stringify(response));
                }
            } else {
                console.log(`[DEV MODE] Skipping real email to ${user.email}. (Macro reminder would have been sent)`);
            }
        } else {
            console.log(`Macros found for ${user.email} on ${today} - no reminder sent.`);
        }
    }
}

export { macroReminderTask };