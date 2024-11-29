import FormData from 'form-data';
import Mailgun from 'mailgun.js'

const mailgun = new Mailgun(FormData)
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY})

/**
 * Sends an email using Mailgun.
 * @param to
 * @param from
 * @param subject
 * @param html
 * @param replyTo
 * @returns {Promise<MessagesSendResult>}
 */
export async function sendEmail (to, from, subject, html, replyTo) {
    const msg = {
        from: from,
        to: to,
        subject: subject,
        html: html,
        'h:Reply-To': replyTo,
    };
    
    return await mg.messages.create(process.env.MAILGUN_DOMAIN, msg);    
}