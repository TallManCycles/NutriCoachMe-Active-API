import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import sgMail from '@sendgrid/mail';
import process from 'process';
import { logError, logInfo } from '../error/log.js';

// Mailgun Setup
const mailgun = new Mailgun(FormData);
const mg = process.env.MAILGUN_API_KEY ? mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY }) : null;

// SendGrid Setup
if (process.env.API_KEY) {
    sgMail.setApiKey(process.env.API_KEY);
}

/**
 * @typedef {Object} EmailResponse
 * @property {boolean} ok - Indicates if the email was sent successfully.
 * @property {number} status - The status code of the response.
 * @property {string} message - The message of the response.
 */

/**
 * Sends an email using the available provider (Mailgun, SendGrid, or Test).
 * Prefers Mailgun if both are available, unless EMAIL_PROVIDER is set to 'sendgrid' or 'test'.
 * 
 * @param {string} to - Recipient email address.
 * @param {string} from - Sender email address.
 * @param {string} subject - Email subject.
 * @param {string} html - Email body in HTML format.
 * @param {string} [replyTo] - Reply-to email address.
 * @returns {Promise<EmailResponse>}
 */
export async function sendEmail(to, from, subject, html, replyTo) {
    const provider = process.env.EMAIL_PROVIDER || (process.env.MAILGUN_API_KEY ? 'mailgun' : 'sendgrid');

    if (provider === 'test') {
        return sendTest(to, from, subject, html, replyTo);
    } else if (provider === 'mailgun' && mg) {
        return sendMailgun(to, from, subject, html, replyTo);
    } else if (process.env.API_KEY) {
        return sendSendGrid(to, from, subject, html, replyTo);
    } else {
        const errorMsg = 'No email provider configured (missing MAILGUN_API_KEY or API_KEY).';
        logError(new Error(errorMsg));
        return { ok: false, status: 500, message: errorMsg };
    }
}

async function sendTest(to, from, subject, html, replyTo) {
    try {
        logInfo('--- [TEST EMAIL PROVIDER] ---');
        logInfo(`To: ${to}`);
        logInfo(`From: ${from}`);
        logInfo(`Subject: ${subject}`);
        logInfo(`Reply-To: ${replyTo}`);
        logInfo(`HTML Content Length: ${html.length} characters`);
        logInfo('-----------------------------');

        return { ok: true, status: 200, message: 'Simulated success (test provider)' };
    } catch (error) {
        logError(error);
        return { ok: false, status: 500, message: error.message };
    }
}

async function sendMailgun(to, from, subject, html, replyTo) {
    try {
        const msg = {
            from: from,
            to: to,
            subject: subject,
            html: html,
            'h:Reply-To': replyTo,
        };

        const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, msg);
        
        if (response.status === 200 || response.status === 202) {
            return { ok: true, status: response.status, message: 'Success' };
        } else {
            return { ok: false, status: response.status, message: 'Failed to send via Mailgun' };
        }
    } catch (error) {
        logError(error);
        return { ok: false, status: 500, message: error.message };
    }
}

async function sendSendGrid(to, from, subject, html, replyTo) {
    try {
        const msg = {
            to: to,
            from: from,
            subject: subject,
            html: html,
            replyTo: replyTo,
        };

        const response = await sgMail.send(msg);
        const status = response[0].statusCode;

        if (status === 200 || status === 202) {
            return { ok: true, status: status, message: 'Success' };
        } else {
            return { ok: false, status: status, message: 'Failed to send via SendGrid' };
        }
    } catch (error) {
        logError(error);
        return { ok: false, status: 500, message: error.message };
    }
}
