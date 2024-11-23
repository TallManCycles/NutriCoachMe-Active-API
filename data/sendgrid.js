import sgMail from "@sendgrid/mail";
import process from "process";

const apiKey = process.env.API_KEY;
sgMail.setApiKey(apiKey);

async function sendEmail(to, from, subject, html, replyTo) {
    try {
        const msg = {
            to: to,
            from: from,
            subject: subject,
            html: html,
            replyTo: replyTo,
        };

        return await sgMail.send(msg);
    } catch (error) {
        console.error('Error sending email', error);
        return error;
    }
    
}

export { sgMail, sendEmail };