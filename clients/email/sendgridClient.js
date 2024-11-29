import process from "process";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.API_KEY;
sgMail.setApiKey(apiKey);

/**
 * @typedef {Object} EmailResponse
 * @property {boolean} ok - Indicates if the email was sent successfully.
 * @property {number} status - The status code of the response.
 * @property {string} message - The message of the response.
 */

/**
 * Sends an email using SendGrid.
 * @param to
 * @param from
 * @param subject
 * @param html
 * @param replyTo
 * @returns {Promise<EmailResponse>}
 */
export async function sendEmail (to, from, subject, html, replyTo) {
    const msg = {
        to: to,
        from: from,
        subject: subject,
        html: html,
        replyTo: replyTo,
    };    
    
    const response = await sgMail.send(msg);

    if (response[0].statusCode === 202) {
        return { 
            ok: true,
            status: 202,
            message: "Success" 
        };
    } else {
        return { 
            ok: false,
            status: response[0].statusCode,
            error: "Failed" 
        };
    }
}