import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import supabase from '../data/supabase.js';
import { sendEmail } from '../data/sendgrid.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '../templates/check-in-template.html');
const htmlContent = fs.readFileSync(templatePath, 'utf8');

async function checkinTask() {
    
    console.log('being email task')
    
    const {data: activeUsers} = await supabase
        .from('users')
        .select()
        .gte('active_until', new Date().toISOString());
    
    if (!activeUsers || activeUsers.length === 0) {
        return;
    }
    
    for (const user of activeUsers) {
        // check if the user has logged a checking in the last 5 days
        const today = new Date();
        const fiveDaysAgo = new Date(today.setDate(today.getDate() - 5)).toISOString();
        
        const {data: checkins, error} = await supabase
            .from('forms')
            .select()
            .eq('uuid', user.uuid)
            .gte('created_at', fiveDaysAgo);
        
        if (!checkins || checkins.length === 0) {
            const response = await sendEmail(
                user.email,
                'coach@fatforweightloss.com.au',
                'Weekly Checkin Reminder',
                htmlContent,
                'coach@fatforweightloss.com.au'
            )
        } else {
            console.log('Checkin found for user', user.email);
        }
    }
}

export { checkinTask };