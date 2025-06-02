import { authenticate } from "./authenticationcontroller.js";
import process from "process";
import sgMail from "@sendgrid/mail";
import express from "express";
import OpenAI from "openai";
import {logError, logInfo} from "../error/log.js";
import multer from "multer";
import path from "path";
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        cb(null, `${baseName}-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage: storage });


let openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const apiKey = process.env.API_KEY;
sgMail.setApiKey(apiKey);

const router = express.Router();

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

router.post("/api/food-assist", authenticate, async (req, res) => {
    try {
        const { calories, protein, carbs, fats, now } = req.body;

        if (!openai) {
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }

        const currentTime = new Date(now);
        const options = { hour: "2-digit", minute: "2-digit", hour12: true };
        const formattedTime = currentTime.toLocaleTimeString("en-US", options);

        const message =
            `Reply in HTML format and suggest some recipes to eat today that fill my remaining macronutrient goals for the day. I have ${calories} calories with ${protein}g of protein, ${carbs}g carbs and ${fats}g fat remaining. It's currently ${formattedTime}.`;

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

router.post("/api/food-nutrition", authenticate, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;

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
        
        // how to get the hostname of the server
        
        const serverUrl = req.protocol + '://' + req.get('host');
        
        const fileUrl = serverUrl + `/uploads/${file.filename}`;
        
        console.log(fileUrl);

        const sampleObjectString = JSON.stringify(sampleObjectJson);

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "user", 
                        content: [
                            { type: "text", text: `Reply as a object in this exact format: ${sampleObjectString} - Tell me the nutritional information from this nutritional label per serving.` },
                            { 
                                type: "image_url", 
                                image_url: {
                                    "url": fileUrl,
                                    "detail": "low"
                                }
                            }
                        ] 
                    }
                ],
                max_tokens: 500
            });

            if (
                response &&
                response.choices.length > 0 &&
                response.choices[0].message &&
                response.choices[0].message.content
            ) {
                console.log(response.choices[0].message.content);
                res.status(200).json({ analysis: response.choices[0].message.content });
            } else {
                res.status(400).json({ error: "Sorry, I can't help with that." });
            }
        } catch (error) {
            logError(error);
            res.status(500).json({ error: "An unknown error has occurred." });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: "An unknown error has occurred." });
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

        try {
            // Create a thread
            const thread = await openai.beta.threads.create();

            // Add a message to the thread
            await openai.beta.threads.messages.create(thread.id, {
                role: "user",
                content: `As a professional nutritionist, please provide a detailed response to this client check-in: ${template}

            Your response must follow this exact structure:

            1. Personal Greeting and Acknowledgment
            - Warmly acknowledge the client's specific situation by their first name and progress mentioned in their check-in

            2. Detailed Analysis
            - Provide a thoughtful analysis of their current situation
            - Highlight both positive aspects and areas that need attention

            3. Three Specific, Actionable Weekly Goals
            Each goal must include:
            - What: Clear, measurable action to take
            - When: Specific timing or frequency
            - How: Step-by-step implementation instructions
            - Why: Brief explanation of the benefits

            4. Accountability Section
            - Specific metrics or ways to track progress
            - Suggestion for documenting their journey

            5. Encouraging Closing
            - Motivational closing statement
            - Invitation to reach out with questions

            Format the entire response in clean, well-structured HTML with appropriate heading tags, paragraphs, and bullet points for easy reading.`
            });

            // Run the assistant
            const run = await openai.beta.threads.runs.create(thread.id, {
                assistant_id: ASSISTANT_ID
            });

            // Wait for the completion
            let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
            
            while (runStatus.status !== 'completed') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
                
                if (runStatus.status === 'failed') {
                    throw new Error('Assistant run failed');
                }
            }

            // Get the messages
            const messages = await openai.beta.threads.messages.list(thread.id);
            const lastMessage = messages.data[0];

            if (lastMessage && lastMessage.content && lastMessage.content[0].text) {
                const content = lastMessage.content[0].text.value;
                logInfo(content);

                const htmlResponse = "<html><body><p>" + content + "</p></body></html>";

                const msg = {
                    to: "fatforweightloss+client@gmail.com", // set to my email address for now to ensure the data is good: formdata.email,
                    from: "support@nutricoachme.com",
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
            } else {
                res.status(400).json({ error: true, message: 'No response from assistant' });
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

router.post("/api/coach-check-in", authenticate, async (req, res) => {
    try {
        const { formdata, template } = req.body;

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
                    
                    res.status(200).json({ message: content });
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