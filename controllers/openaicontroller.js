import process from "process";
import path from "path";

import express from "express";
import multer from "multer";
import OpenAI from "openai";
import sgMail from "@sendgrid/mail";

import { authenticate } from "./authenticationcontroller.js";
import { logError, logInfo } from "../error/log.js";

// --- Configuration ---

const router = express.Router();
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Initialize Clients
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

sgMail.setApiKey(process.env.API_KEY);

// Configure Multer
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

// --- Constants ---

const SAMPLE_NUTRITION_OBJECT = [
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

const CHECKIN_PROMPT_TEMPLATE = `As a professional nutritionist, please provide a detailed response to this client check-in: {{TEMPLATE}}

You are Aaron Day, a professional nutritionist. Provide a detailed, encouraging response to a client's weekly check-in. Include actionable tips for the upcoming week and sign off as Aaron Day. Be concise and do not repeat yourself

Your response must follow this exact structure, but must flow like an email to a regular human. Don't use these as headings, but as structure to your response:

1. Personal Greeting and Acknowledgment
- Warmly acknowledge the client's specific situation by their first name and progress mentioned in their check-in
- Always start the email using "Hey {NAME}" where NAME is their first name.

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

6. Tone and sign off.
- Make the tone casual, but knowledgeable.
- Sign off like this:
    Speak soon,
    Aaron Day
    
7. Use the metric system. Always, no exceptions.

8. Weight loss is the primary goal, even if it's slow. Be kind.


Format the entire response in clean, well-structured HTML with appropriate heading tags, paragraphs, and bullet points for easy reading. 
This will be sent as an email.`;

// --- Routes ---

router.post("/api/food-assist", authenticate, async (req, res) => {
    try {
        const { calories, protein, carbs, fats, now } = req.body;

        const currentTime = new Date(now);
        const options = { hour: "2-digit", minute: "2-digit", hour12: true };
        const formattedTime = currentTime.toLocaleTimeString("en-US", options);

        const message = `Reply in HTML format and suggest some recipes to eat today that fill my remaining macronutrient goals for the day. I have ${calories} calories with ${protein}g of protein, ${carbs}g carbs and ${fats}g fat remaining. It's currently ${formattedTime}.`;

        const response = await openai.chat.completions.create({
            messages: [{ role: "system", content: message }],
            model: "gpt-4o-mini",
            max_tokens: 1000,
        });

        if (response?.choices?.[0]?.message?.content) {
            res.status(200).json({ message: response.choices[0].message.content });
        } else {
            res.status(400).json({ error: "Sorry, I can't help with that." });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: "An unknown error has occurred." });
    }
});

router.post("/api/food-input", authenticate, async (req, res) => {
    try {
        const { prompt } = req.body;
        const sampleObjectString = JSON.stringify(SAMPLE_NUTRITION_OBJECT);
        const message = `Reply as an object in this exact format: ${sampleObjectString} - give me the nutrition for these items weight in grams: ${prompt}`;

        const response = await openai.chat.completions.create({
            messages: [{ role: "system", content: message }],
            model: "gpt-4o-mini",
            max_tokens: 500,
        });

        if (response?.choices?.[0]?.message?.content) {
            res.status(200).json({ message: response.choices[0].message.content });
        } else {
            res.status(400).json({ error: true });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: true });
    }
});

router.post("/api/food-nutrition", authenticate, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const sampleObjectString = JSON.stringify(SAMPLE_NUTRITION_OBJECT);
        
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${serverUrl}/uploads/${file.filename}`;
        
        console.log(`Processing file: ${fileUrl}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user", 
                    content: [
                        { type: "text", text: `Reply as an object in this exact format: ${sampleObjectString} - Tell me the nutritional information from this nutritional label per serving.` },
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

        if (response?.choices?.[0]?.message?.content) {
            res.status(200).json({ analysis: response.choices[0].message.content });
        } else {
            res.status(400).json({ error: "Sorry, I can't help with that." });
        }
    } catch (error) {
        logError(error);
        res.status(500).json({ error: "An unknown error has occurred." });
    }
});

router.post("/api/create-self-checkin", authenticate, async (req, res) => {
    try {
        const { formdata, template, subject } = req.body;

        const messageContent = CHECKIN_PROMPT_TEMPLATE.replace('{{TEMPLATE}}', template);

        const thread = await openai.beta.threads.create();

        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: messageContent
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: ASSISTANT_ID,
            model: "gpt-5"
        });

        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        
        while (runStatus.status !== 'completed') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
            
            if (runStatus.status === 'failed') {
                throw new Error('Assistant run failed');
            }
        }

        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messages.data[0];

        if (lastMessage?.content?.[0]?.text?.value) {
            const content = lastMessage.content[0].text.value;
            logInfo(content);

            const htmlResponse = `<html><body style="font-family: Arial, sans-serif; line-height: 1.6;">${content}</body></html>`;

            const msg = {
                to: "fatforweightloss+client@gmail.com",
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
});

router.post("/api/coach-check-in", authenticate, async (req, res) => {
    try {
        const { template } = req.body;

        const requestPayload = {
            messages: [
                {
                    role: "system", 
                    //content: "You are Aaron Day, a professional nutritionist. Provide a detailed, encouraging response to a client's weekly check-in. Include actionable tips for the upcoming week and sign off as Aaron Day. Format the response in clean HTML for an email. Be concise and do not repeat yourself." 
                    content: CHECKIN_PROMPT_TEMPLATE
                },
                {
                    role: "user", 
                    content: `Client Check-in Details:\n${template}` 
                }
            ],
            model: "gpt-5",
            max_completion_tokens: 10000
        };

        logInfo("OpenAI Request Payload: " + JSON.stringify(requestPayload, null, 2));

        const response = await openai.chat.completions.create(requestPayload);

        logInfo("OpenAI Raw Response: " + JSON.stringify(response, null, 2));

        if (response?.choices?.[0]?.message?.content) {
            const content = response.choices[0].message.content;
            res.status(200).json({ message: content });
        } else {
            logError("OpenAI Empty Response Choices");
            res.status(400).json({ error: true, message: 'No response from AI' });
        }
    } catch (error) {
        logError("OpenAI Error: " + error.toString());
        res.status(500).json({ error: true, message: error.toString() });
    }
});

export default router;