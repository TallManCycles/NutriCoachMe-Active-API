import { authenticate } from "./authenticationcontroller.js";
import express from "express";
import { logError } from "../error/log.js";
import { sendEmail } from "../clients/email/mailgunClient.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const contactFormLimiter = rateLimit({
    windowMs: 30 * 1000, 
    max: 1, 
    message: "Too many requests"
});

router.post("/api/contact-form", contactFormLimiter, async (req, res) => {
    try {
        const { name, email, message } = req.body;

        const msg = `<p>${name} has submitted a contact form.</p> <br> <p>Message: ${message}</p>`;

        const response = await sendEmail(
            'support@nutricoachme.com',
            email,
            'Contact Form Submission',
            msg,
            email
        );

        if (response.ok) {
            res.status(200).json({ message: "Success" });
        } else {
            res.status(500).json({ error: "Failed" });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: "An unknown error has occured." });
    }
});

export default router;