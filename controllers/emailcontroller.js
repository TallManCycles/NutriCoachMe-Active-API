import sgMail from "@sendgrid/mail";
import authenticate from "./authenticationcontroller.js";
import express from "express";
import process from "process";
import {logError} from "../error/log.js";

const apiKey = process.env.API_KEY;
sgMail.setApiKey(apiKey);

const router = express.Router();

router.post("/api/send-email", authenticate, async (req, res) => {
    try {
        const { formdata, template, subject } = req.body;

        const msg = {
            to: "fatforweightloss@gmail.com",
            from: "coach@fatforweightloss.com.au",
            subject: subject,
            html: template,
            replyTo: formdata.email,
        };

        const response = await sgMail.send(msg);

        if (response[0].statusCode === 202) {
            res.status(200).json({ message: "Success" });
        } else {
            res.status(500).json({ error: "Failed" });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: "An unknown error has occured." });
    }
});

router.post("/api/send-email-user", authenticate, async (req, res) => {
    try {
        const { html, subject, to, from, replyTo } = req.body;

        const msg = {
            to: to,
            from: from,
            subject: subject,
            html: html,
            replyTo: replyTo,
        };
        
        console.log(msg);

        const response = await sgMail.send(msg);

        if (response[0].statusCode === 202) {
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