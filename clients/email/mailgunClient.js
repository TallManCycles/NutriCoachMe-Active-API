import FormData from 'form-data';
import Mailgun from 'mailgun.js'

const mailgun = new Mailgun(FormData)
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY})

/**
 * @typedef {Object} EmailResponse
 * @property {boolean} ok - Indicates if the email was sent successfully.
 * @property {number} status - The status code of the response.
 * @property {string} message - The message of the response.
 */

/**
 * Sends an email using Mailgun.
 * @param to
 * @param from
 * @param subject
 * @param html
 * @param replyTo
 * @returns {Promise<EmailResponse>}
 */
export async function sendEmail (to, from, subject, html, replyTo) {
    const msg = {
        from: from,
        to: to,
        subject: subject,
        html: html,
        'h:Reply-To': replyTo,
    };
    
    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, msg);
    
    console.log(response);

    if (response.status === 200) {
        return {
            ok: true,
            status: 200,
            message: "Success"
        };
    } else {
        return {
            ok: false,
            status: response.status,
            error: "Failed"
        };
    }
}