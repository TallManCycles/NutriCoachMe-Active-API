import 'dotenv/config';
import express from "express";
import cors from "cors";
import process from "process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

import stripeWebhookController from './controllers/stripewebhookcontroller.js';
import emailController from "./controllers/emailcontroller.js";
import healthcheckController from "./controllers/healthcheckcontroller.js";
import openaiController from "./controllers/openaicontroller.js";
import stripeController from "./controllers/stripecontroller.js";
import "./tasks/scheduledTasks.js";

// Initialize Stripe client
let stripeKey = ''
if (process.env.NODE_ENV === 'development') {
  stripeKey = process.env.STRIPE_TEST_SECRET_KEY;
    } else {
  stripeKey = process.env.STRIPE_LIVE_SECRET_KEY;
}

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
  }),
);

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }
} catch (error) {
    console.log('Error creating uploads directory', error);
}

// webhooks need to be setup before the body parser
app.use('/webhook/stripe', stripeWebhookController);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/', stripeController);
app.use('/', emailController);
app.use('/', healthcheckController)
app.use('/', openaiController);

console.log('Server running on port', process.env.PORT || 3000);
console.log('Server startup time', new Date().toLocaleString());

const port = process.env.PORT || 3000;
app.listen(port);
