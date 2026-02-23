import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import process from 'process';
import supabase from '../data/supabase.js';
import { sendEmail } from '../data/sendgrid.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '../templates/check-in-template.html');
const htmlContent = fs.readFileSync(templatePath, 'utf8');

async function checkinTask() {
    
    console.log('begin email task at', new Date().toLocaleString());
    
    // Only send to active and opt in email reminders
    const {data: activeUsers} = await supabase
        .from('users')
        .select()
        .eq('checkin_reminders', true)
        .gte('active_until', new Date().toISOString());
    
    if (!activeUsers || activeUsers.length === 0) {
        console.log('No active users found');
        return;
    }
    
    for (const user of activeUsers) {
        // check if the user has logged a checking in the last 5 days
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const fiveDaysAgoISO = fiveDaysAgo.toISOString();
        
        console.log(`Checking for checkins for ${user.email} since ${fiveDaysAgoISO}`);

        const {data: checkins, error} = await supabase
            .from('forms')
            .select()
            .eq('uuid', user.uuid)
            .gte('created_at', fiveDaysAgoISO);
        
        if (error) {
            console.error(`Error fetching checkins for ${user.email}:`, error);
            continue;
        }

        if (!checkins || checkins.length === 0) {
            console.log(`No checkin found for ${user.email}.`);
            
            if (process.env.NODE_ENV === 'production') {
                console.log(`Sending real reminder email to ${user.email}...`);
                const response = await sendEmail(
                    user.email,
                    'support@nutricoachme.com',
                    'Weekly Checkin Reminder',
                    htmlContent,
                    'aaron@nutricoachme.com'
                );
                
                if (response && response[0] && response[0].statusCode === 202) {
                    console.log('Email sent successfully to', user.email);
                } else {
                    console.error('Failed to send email to', user.email, 'Response:', JSON.stringify(response));
                }
            } else {
                console.log(`[DEV MODE] Skipping real email to ${user.email}. (Checkin reminder would have been sent)`);
            }
        } else {
            console.log('Checkin found for user', user.email, '- no reminder sent.');
        }
    }
}

export { checkinTask };