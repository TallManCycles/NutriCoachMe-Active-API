import process from "process";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.API_KEY;
sgMail.setApiKey(apiKey);


/**
 * Sends an email using SendGrid.
 * @param to
 * @param from
 * @param subject
 * @param html
 * @param replyTo
 * @returns {Promise<[Response<object>, {}]>}
 */
export async function sendEmail (to, from, subject, html, replyTo) {
    const msg = {
        to: to,
        from: from,
        subject: subject,
        html: html,
        replyTo: replyTo,
    };    
    
    return await sgMail.send(msg);
}