import { authenticate } from "./authenticationcontroller.js";
import express from "express";
import { logError } from "../error/log.js";
import { sendEmail } from "../service/emailService.js";

const router = express.Router();

router.post("/api/send-email", authenticate, async (req, res) => {
    try {
        const { formdata, template, subject } = req.body;

        const response = await sendEmail(
            "fatforweightloss@gmail.com",
            "aaron@nutricoachme.com",
            subject,
            template,
            formdata.email
        );
        
        if (response.ok) {
            res.status(200).json({ message: "Success" });
        } else {
            res.status(500).json({ error: "Failed" });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: "An unknown error has occurred." });
    }
});

router.post("/api/send-email-user", authenticate, async (req, res) => {
    try {
        const { html, subject, to, from, replyTo } = req.body;

        const response = await sendEmail(
            to,
            from,
            subject,
            html,
            replyTo,
        );

        if (response.ok) {
            res.status(200).json({ message: "Success" });
        } else {
            res.status(500).json({ error: "Failed" });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: "An unknown error has occurred." });
    }
});

router.post("/api/send-email-notification", authenticate, async (req, res) => {
    try {
        const { html, subject, to, from } = req.body;

        const response = await sendEmail(
            to,
            from,
            subject,
            html,
            from,
        );

        if (response.ok) {
            res.status(200).json({ message: "Success" });
        } else {
            res.status(500).json({ error: "Failed" });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: "An unknown error has occurred." });
    }
});

export default router;