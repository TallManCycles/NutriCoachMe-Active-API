import authenticate from "./authenticationcontroller.js";
import process from "process";
import sgMail from "@sendgrid/mail";
import express from "express";
import OpenAI from "openai";
import {logError, logInfo} from "../error/log.js";

let openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const apiKey = process.env.API_KEY;
sgMail.setApiKey(apiKey);

const router = express.Router();

router.post("/api/food-assist", authenticate, async (req, res) => {
    try {
        const { calories, protein, carbs, fats } = req.body;

        if (!openai) {
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }

        const currentTime = new Date();
        const options = { hour: "2-digit", minute: "2-digit", hour12: true };
        const formattedTime = currentTime.toLocaleTimeString("en-US", options);

        const message =
            `Reply and suggest some recipes to eat today that fill my remaining macronutrient goals for the day. I have ${calories} calories with ${protein}g of protein, ${carbs}g carbs and ${fats}g fat remaining. It's currently ${formattedTime}.`;

        try {
            const response = await openai.chat.completions.create({
                messages: [{ role: "system", content: message }],
                model: "gpt-4o-mini",
                max_tokens: 500,
            });
            if (
                response &&
                response.choices.length > 0 &&
                response.choices[0].message &&
                response.choices[0].message.content
            ) {
                res.status(200).json({ message: response.choices[0].message.content });
            } else {
                res.status(400).json({ error: "Sorry, I can't help with that." });
            }
        } catch (error) {
            logError(error);
            res.status(500).json({ error: "An unknown error has occured." });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: "An unknown error has occured." });
    }
});

router.post("/api/food-input", authenticate, async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!openai) {
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }

        const sampleObjectJson = [
            {
                food: "sample food",
                weight: "100",
                type: "g",
                calories: 200,
                protein: 50,
                carbs: 20,
                fats: 10,
            },
        ];

        const sampleObjectString = JSON.stringify(sampleObjectJson);

        const message =
            `Reply as a object in this exact format: ${sampleObjectString} - give me the nutrition for these items weight in grams: ${prompt}`;

        try {
            const response = await openai.chat.completions.create({
                messages: [{ role: "system", content: message }],
                model: "gpt-3.5-turbo",
                max_tokens: 500,
            });
            if (
                response &&
                response.choices.length > 0 &&
                response.choices[0].message &&
                response.choices[0].message.content
            ) {
                try {
                    const content = response.choices[0].message.content;
                    res.status(200).json({ message: content });
                } catch (error) {
                    res.status(500).json({ error: true });
                }
            } else {
                res.status(400).json({ error: true });
            }
        } catch (error) {
            logError(error);
            res.status(500).json({ error: true });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: true });
    }
});

router.post("/api/create-self-checkin", authenticate, async (req, res) => {
    try {
        const { formdata, template, subject } = req.body;

        if (!openai) {
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }

        const message =
            `Reply in detail as a nutritionist, and give some actionable tips for the upcoming week and sign off as Aaron Day. Create the response in html format for an email. ${template}`;

        try {
            const response = await openai.chat.completions.create({
                messages: [{ role: "system", content: message }],
                model: "gpt-4o-mini",
                max_tokens: 1000,
            });
            if (
                response &&
                response.choices.length > 0 &&
                response.choices[0].message &&
                response.choices[0].message.content
            ) {
                try {
                    const content = response.choices[0].message.content;

                    logInfo(content);

                    const htmlResponse = "<html><body><p>" + content +
                        "</p></body></html>";

                    const msg = {
                        to: "fatforweightloss+client@gmail.com", // set to my email address for now to ensure the data is good: formdata.email,
                        from: "coach@fatforweightloss.com.au",
                        subject: subject,
                        html: htmlResponse,
                        replyTo: formdata.email,
                    };

                    const emailResponse = await sgMail.send(msg);

                    if (emailResponse[0].statusCode === 202) {
                        res.status(200).json({ message: "Success" });
                    } else {
                        res.status(500).json({ error: "Failed" });
                    }
                } catch (ex) {
                    res.status(500).json({ error: true, message: ex.toString() });
                }
            } else {
                res.status(400).json({ error: true, message: 'No response' });
            }
        } catch (error) {
            logError(error);
            res.status(500).json({ error: true, message: error.toString() });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: true, message: error.toString() });
    }
});

export default router;